import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, Timer, ArrowLeft, RefreshCw, LogIn } from "lucide-react";
import { QrCode } from "@/components/QrCode";
import { SURCHARGE, fmtDate, fmtTime, seatsOf, seededSold, vnd } from "@/lib/data";
import { uid, useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { api, type ApiSeatStatus } from "@/lib/api";

export const Route = createFileRoute("/dat-ve/$showtimeId")({
  head: () => ({
    meta: [
      { title: "Chọn ghế & thanh toán — CineVé" },
      { name: "description", content: "Chọn ghế theo sơ đồ phòng chiếu thời gian thực, giữ chỗ và thanh toán qua MoMo/VNPay." },
      { property: "og:title", content: "Chọn ghế & thanh toán — CineVé" },
      { property: "og:description", content: "Đặt vé xem phim trực tuyến." },
    ],
  }),
  component: Booking,
});

type Step = "seats" | "payment" | "success";

interface FormattedSeat {
  seatId: string | number;
  numericSeatId?: number;
  seatNumber: string;
  seatType: "STANDARD" | "VIP" | "COUPLE";
  status: "FREE" | "HELD" | "SOLD";
  price: number;
}

export function Booking() {
  const { showtimeId } = Route.useParams();
  const { user, setShowLoginModal } = useAuth();
  const store = useStore();

  const [step, setStep] = useState<Step>("seats");
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [realSeats, setRealSeats] = useState<FormattedSeat[]>([]);
  const [showInfo, setShowInfo] = useState<{
    movieTitle: string;
    movieId: string;
    hallName: string;
    startTime: string;
    basePrice: number;
  } | null>(null);

  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [method, setMethod] = useState<"MOMO" | "VNPAY">("MOMO");
  const [backendBookingId, setBackendBookingId] = useState<number | null>(null);
  const [localBookingId, setLocalBookingId] = useState<string>("");
  const [paidTickets, setPaidTickets] = useState<any[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");

  // Load showtime and real seats from backend if possible
  const loadSeatData = () => {
    const numId = Number(showtimeId);
    if (!isNaN(numId)) {
      setLoadingSeats(true);
      Promise.all([
        api.getShowtime(numId).catch(() => null),
        api.getSeatsStatus(numId).catch(() => null),
      ]).then(([st, seats]) => {
        if (st) {
          setShowInfo({
            movieTitle: st.movie?.title || "Phim điện ảnh",
            movieId: String(st.movieId),
            hallName: st.hall?.hallName || `Phòng ${st.hallId}`,
            startTime: st.startTime,
            basePrice: Number(st.ticketPrice),
          });
        }
        if (seats && Array.isArray(seats) && seats.length > 0) {
          setRealSeats(
            seats.map((s: ApiSeatStatus) => ({
              seatId: s.seatId,
              numericSeatId: s.seatId,
              seatNumber: s.seatNumber,
              seatType: s.seatType,
              status: s.status,
              price: s.price,
            }))
          );
        }
        setLoadingSeats(false);
      });
    } else {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    loadSeatData();
  }, [showtimeId]);

  // Fallback to local store data if backend did not provide seats
  const fallbackShow = store.showtimes.find((s) => s.showtimeId === showtimeId);
  const fallbackHall = store.halls.find((h) => h.hallId === fallbackShow?.hallId);
  const fallbackMovie = store.movies.find((m) => m.movieId === fallbackShow?.movieId);

  const finalShowInfo = showInfo || (fallbackShow && fallbackMovie && fallbackHall ? {
    movieTitle: fallbackMovie.title,
    movieId: fallbackMovie.movieId,
    hallName: fallbackHall.hallName,
    startTime: fallbackShow.startTime,
    basePrice: fallbackShow.ticketPrice,
  } : null);

  const fallbackSeats: FormattedSeat[] = useMemo(() => {
    if (!fallbackHall) return [];
    const soldSet = new Set(seededSold(showtimeId, fallbackHall));
    store.tickets.filter((t) => t.showtimeId === showtimeId).forEach((t) => soldSet.add(t.seatId));
    return seatsOf(fallbackHall).map((s): FormattedSeat => {
      const rawType: string = s.seatType;
      let seatType: "VIP" | "STANDARD" | "COUPLE" = "STANDARD";
      if (rawType === "VIP") seatType = "VIP";
      else if (rawType === "COUPLE" || rawType === "Couple") seatType = "COUPLE";
      return {
        seatId: s.seatId,
        seatNumber: s.seatNumber,
        seatType,
        status: soldSet.has(s.seatId) ? "SOLD" : "FREE",
        price: (fallbackShow?.ticketPrice || 80000) + (SURCHARGE[seatType as keyof typeof SURCHARGE] ?? 0),
      };
    });
  }, [fallbackHall, showtimeId, store.tickets, fallbackShow]);

  const activeSeats = realSeats.length > 0 ? realSeats : fallbackSeats;

  // Countdown timer for seat hold
  useEffect(() => {
    if (!holdUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [holdUntil]);

  const remaining = holdUntil ? Math.max(0, Math.round((holdUntil - now) / 1000)) : 0;

  useEffect(() => {
    if (holdUntil && remaining === 0 && step === "payment") {
      setHoldUntil(null);
      setStep("seats");
      setError("Hết thời gian giữ ghế. Ghế đã được tự động mở khóa, vui lòng chọn lại.");
      loadSeatData();
    }
  }, [remaining, holdUntil, step]);

  if (!finalShowInfo && !loadingSeats) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-xl font-semibold">Không tìm thấy thông tin suất chiếu.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const seatById = (id: string | number) => activeSeats.find((s) => s.seatId === id);
  const chosen = selected.map(seatById).filter(Boolean) as FormattedSeat[];
  const total = chosen.reduce((sum, s) => sum + s.price, 0);

  const toggleSeat = (s: FormattedSeat) => {
    if (step !== "seats" || s.status !== "FREE") return;
    setError(null);
    setSelected((prev) =>
      prev.includes(s.seatId)
        ? prev.filter((x) => x !== s.seatId)
        : prev.length >= 8
        ? prev
        : [...prev, s.seatId]
    );
  };

  // Step 1 -> Step 2: Check & Hold Seat
  const handleHoldAndPay = async () => {
    if (selected.length === 0) return;
    if (!user) {
      setError("Vui lòng đăng nhập tài khoản để tiến hành giữ ghế và thanh toán!");
      setShowLoginModal(true);
      return;
    }

    setError(null);
    const numId = Number(showtimeId);

    // Call backend if real showtime
    if (!isNaN(numId) && realSeats.length > 0) {
      try {
        const payload = {
          showtimeId: numId,
          seats: chosen.map((c) => ({ seatId: c.numericSeatId! })),
        };
        const bookingRes = await api.createBooking(payload);
        setBackendBookingId(bookingRes.bookingId);

        // Request payment QR
        const payReq = await api.createPaymentRequest(bookingRes.bookingId, method);
        setQrDataUrl(payReq.qrDataUrl);
        setTransactionId(payReq.transactionId);

        const expSec = bookingRes.holdExpiresInSeconds || 480;
        setHoldUntil(Date.now() + expSec * 1000);
        setNow(Date.now());
        setStep("payment");
      } catch (err: any) {
        setError(err?.message || "Không thể giữ ghế. Vui lòng thử lại!");
        loadSeatData();
      }
    } else {
      // Local fallback hold
      setHoldUntil(Date.now() + 7 * 60 * 1000);
      setNow(Date.now());
      setStep("payment");
    }
  };

  // Payment Cancel / Fail
  const handlePayFail = async () => {
    if (backendBookingId) {
      try {
        await api.paymentCallback(backendBookingId, false);
      } catch (e) {
        /* expected rejection that unlocks seats */
      }
      setBackendBookingId(null);
    }
    setHoldUntil(null);
    setStep("seats");
    setError("Thanh toán đã hủy / thất bại. Ghế đã được mở khóa tự do.");
    loadSeatData();
  };

  // Payment Success
  const handlePaySuccess = async () => {
    if (backendBookingId) {
      try {
        const callbackRes = await api.paymentCallback(backendBookingId, true, transactionId);
        setPaidTickets(callbackRes.tickets || []);
        setHoldUntil(null);
        setStep("success");
      } catch (err: any) {
        setError(err?.message || "Xử lý thanh toán thất bại");
      }
    } else {
      // Local fallback success
      const id = uid("BK");
      store.set((s) => ({
        ...s,
        bookings: [
          ...s.bookings,
          {
            bookingId: id,
            userId: user?.email || "khach@cinema.vn",
            bookingDate: new Date().toISOString(),
            totalAmount: total,
            status: "Đã thanh toán",
            paymentQrCode: id,
            method,
          },
        ],
        tickets: [
          ...s.tickets,
          ...chosen.map((seat) => ({
            ticketId: uid("VE"),
            bookingId: id,
            showtimeId,
            seatId: String(seat.seatId),
            price: seat.price,
            isCheckedIn: false,
          })),
        ],
      }));
      setLocalBookingId(id);
      setHoldUntil(null);
      setStep("success");
    }
  };

  // Extract rows
  const rows = [...new Set(activeSeats.map((s: FormattedSeat) => s.seatNumber.charAt(0)))].sort();
  const steps: [Step, string][] = [
    ["seats", "Chọn ghế"],
    ["payment", "Thanh toán"],
    ["success", "Nhận vé"],
  ];

  const activeSeatsForRender = activeSeats;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {finalShowInfo && (
            <Link
              to="/phim/$movieId"
              params={{ movieId: finalShowInfo.movieId }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition mb-1"
            >
              <ArrowLeft className="h-4 w-4" /> {finalShowInfo.movieTitle}
            </Link>
          )}
          {finalShowInfo && (
            <h1 className="text-3xl font-bold uppercase md:text-4xl">
              {fmtTime(finalShowInfo.startTime)} · {fmtDate(finalShowInfo.startTime)} · {finalShowInfo.hallName}
            </h1>
          )}
        </div>
        <ol className="flex gap-2 text-sm">
          {steps.map(([k, l], i) => (
            <li
              key={k}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                step === k ? "bg-primary text-primary-foreground shadow" : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}. {l}
            </li>
          ))}
        </ol>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          {!user && (
            <button
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center gap-1 rounded bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground hover:opacity-90"
            >
              <LogIn className="h-3 w-3" /> Đăng nhập ngay
            </button>
          )}
        </div>
      )}

      {step === "success" ? (
        <SuccessView
          bookingId={backendBookingId ? `BK${backendBookingId}` : localBookingId}
          tickets={paidTickets}
          showInfo={finalShowInfo}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card p-6 shadow-sm">
            {step === "seats" ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Sơ đồ ghế trực tiếp từ phòng chiếu</span>
                  <button
                    onClick={loadSeatData}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingSeats ? "animate-spin" : ""}`} /> Làm mới ghế
                  </button>
                </div>

                <div className="screen-curve mx-auto mb-10 h-8 w-3/4 text-center text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <span className="relative top-3">Màn hình</span>
                </div>

                <div className="mx-auto w-fit space-y-2 py-2">
                  {rows.map((r) => (
                    <div key={r} className="flex items-center gap-1.5">
                      <span className="w-5 text-center text-xs font-bold text-muted-foreground">{r}</span>
                      {activeSeatsForRender
                        .filter((s: FormattedSeat) => s.seatNumber.charAt(0) === r && s.seatType !== "COUPLE")
                        .map((s: FormattedSeat) => {
                          const isSold = s.status === "SOLD";
                          const isHeld = s.status === "HELD";
                          const isSel = selected.includes(s.seatId);

                          const isVip = s.seatType === "VIP";

                          const base = isVip
                            ? "bg-seat-vip"
                            : "bg-seat-free";

                          if (s.seatType === "COUPLE") {
                            return null;
                          }

                          let cls = "";
                          if (isSold) {
                            cls = "bg-seat-sold text-muted-foreground/30 cursor-not-allowed opacity-40";
                          } else if (isHeld) {
                            cls = "bg-amber-500/40 text-amber-200 cursor-not-allowed animate-pulse";
                          } else if (isSel) {
                            cls = "bg-primary text-primary-foreground font-bold shadow-glow scale-105";
                          } else {
                            cls = `${base} hover:ring-2 hover:ring-primary hover:scale-105`;
                          }

                          return (
                            <button
                              key={String(s.seatId)}
                              disabled={isSold || isHeld}
                              onClick={() => toggleSeat(s)}
                              title={`${s.seatNumber} · ${String(s.seatType)} · ${vnd(s.price)}${isHeld ? " (Đang có người giữ)" : ""}`}
                              className={`h-7 rounded-t-md text-[10px] font-medium transition w-7 ${cls}`}
                            >
                              {isSold ? "×" : isHeld ? "⏳" : s.seatNumber.slice(1)}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  {[
                    ["bg-seat-free", "Ghế thường"],
                    ["bg-seat-vip", "Ghế VIP"],
                    ["bg-seat-couple", "Ghế Couple"],
                    ["bg-primary", "Đang chọn"],
                    ["bg-amber-500/40", "Đang giữ (Hold)"],
                    ["bg-seat-sold opacity-50", "Đã bán"],
                  ].map(([c, l]) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className={`h-3.5 w-3.5 rounded-sm ${c}`} />
                      {l}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-2xl font-bold uppercase">Phương thức thanh toán</h2>
                  <div className="space-y-2">
                    {[
                      { id: "MOMO", name: "Ví MoMo (QR Code)" },
                      { id: "VNPAY", name: "VNPay QR (Cổng VNPAY-QR)" },
                    ].map((m) => (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          method === m.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card/50 hover:bg-secondary/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={method === m.id}
                          onChange={() => setMethod(m.id as any)}
                          className="accent-primary h-4 w-4"
                        />
                        <span className="font-semibold text-foreground">{m.name}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-border/80 bg-background/50 p-4">
                    <p className="text-xs font-semibold uppercase text-primary">Mô phỏng giao dịch thanh toán</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Trong môi trường thử nghiệm, bạn có thể bấm xác nhận thanh toán thành công hoặc giả lập hủy/thất bại để kiểm tra cơ chế nhả ghế.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handlePaySuccess}
                        className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow"
                      >
                        Thanh toán thành công
                      </button>
                      <button
                        onClick={handlePayFail}
                        className="flex-1 rounded-lg border border-destructive/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 transition"
                      >
                        Thất bại / Hủy đơn
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl bg-background/60 p-6 text-center border border-border">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR thanh toán" className="h-48 w-48 rounded-lg border border-border bg-white p-2 shadow-md" />
                  ) : (
                    <QrCode value={`${method}-${showtimeId}-${total}`} size={180} />
                  )}
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Quét mã QR bằng ứng dụng {method}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">{vnd(total)}</p>
                  {transactionId && (
                    <p className="mt-2 font-mono text-[10px] text-muted-foreground">Mã GD: {transactionId}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar */}
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
            {finalShowInfo && (
              <>
                <h2 className="text-2xl font-bold uppercase">{finalShowInfo.movieTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {finalShowInfo.hallName} · {fmtTime(finalShowInfo.startTime)} {fmtDate(finalShowInfo.startTime)}
                </p>
              </>
            )}

            {holdUntil && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-lg p-2.5 text-xs font-semibold ${
                  remaining < 60
                    ? "bg-destructive/15 text-destructive animate-pulse"
                    : "bg-primary/15 text-primary"
                }`}
              >
                <Timer className="h-4 w-4" /> Giữ ghế còn: {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, "0")}
              </div>
            )}

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              {chosen.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa chọn ghế nào (tối đa 8 ghế/lần đặt).</p>
              ) : (
                chosen.map((s) => (
                  <div key={String(s.seatId)} className="flex items-center justify-between text-xs">
                    <span>
                      Ghế <b className="text-foreground">{s.seatNumber}</b>{" "}
                      <span className="text-muted-foreground">({s.seatType})</span>
                    </span>
                    <span className="font-medium text-foreground">{vnd(s.price)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold">Tổng tiền</span>
              <span className="font-display text-2xl font-bold text-primary">{vnd(total)}</span>
            </div>

            {step === "seats" && (
              <button
                disabled={!selected.length}
                onClick={handleHoldAndPay}
                className="mt-5 w-full rounded-xl bg-primary py-3 font-bold uppercase tracking-wider text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-40"
              >
                {!user ? "Đăng nhập để giữ ghế & đặt" : "Xác nhận & Giữ ghế"}
              </button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function SuccessView({
  bookingId,
  tickets,
  showInfo,
}: {
  bookingId: string;
  tickets: any[];
  showInfo: any;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
      <h2 className="mt-3 text-4xl font-bold uppercase tracking-wide">Đặt vé thành công!</h2>
      <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4 text-primary" /> Vé điện tử đã được xác nhận và gửi tới hộp thư email của bạn.
      </p>

      <div className="mt-8 text-left space-y-3">
        {tickets.length > 0 ? (
          tickets.map((t) => (
            <div key={t.ticketCode} className="flex overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex-1 p-4">
                <p className="text-xs uppercase tracking-widest text-primary font-bold">Vé điện tử CineVé</p>
                <h3 className="text-2xl font-bold uppercase">{showInfo?.movieTitle || "Phim điện ảnh"}</h3>
                <p className="text-sm text-muted-foreground">
                  {showInfo?.hallName} · {showInfo && fmtTime(showInfo.startTime)} {showInfo && fmtDate(showInfo.startTime)}
                </p>
                <p className="mt-2 text-sm">
                  Ghế <b>{t.seatNumber}</b> · <span className="text-primary font-semibold">{vnd(t.price)}</span>
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">Mã vé: {t.ticketCode}</p>
                <span className="mt-2 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Chưa sử dụng
                </span>
              </div>
              <div className="flex items-center justify-center border-l-2 border-dashed border-border bg-white p-4">
                {t.qrDataUrl ? (
                  <img src={t.qrDataUrl} alt={t.ticketCode} className="h-28 w-28" />
                ) : (
                  <QrCode value={t.ticketCode} size={110} />
                )}
              </div>
            </div>
          ))
        ) : (
          <TicketList bookingId={bookingId} />
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/lich-su"
          className="rounded-xl bg-primary px-6 py-2.5 font-bold uppercase tracking-wider text-primary-foreground shadow hover:opacity-90 transition"
        >
          Xem tất cả vé của tôi
        </Link>
        <Link
          to="/"
          className="rounded-xl border border-border bg-secondary/50 px-6 py-2.5 font-bold uppercase tracking-wider text-foreground hover:bg-secondary transition"
        >
          Tiếp tục xem phim
        </Link>
      </div>
    </div>
  );
}

export function TicketList({ bookingId }: { bookingId: string }) {
  const { tickets, showtimes, movies, halls } = useStore();
  const list = tickets.filter((t) => t.bookingId === bookingId);
  return (
    <div className="space-y-3">
      {list.map((t) => {
        const s = showtimes.find((x) => x.showtimeId === t.showtimeId);
        const m = movies.find((x) => x.movieId === s?.movieId);
        const h = halls.find((x) => x.hallId === s?.hallId);
        const seatNum = t.seatId.includes("-") ? t.seatId.split("-")[1] : t.seatId;
        return (
          <div key={t.ticketId} className="flex overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex-1 p-4">
              <p className="text-xs uppercase tracking-widest text-primary font-bold">Vé điện tử</p>
              <h3 className="text-2xl font-bold uppercase">{m?.title || "Phim CineVé"}</h3>
              <p className="text-sm text-muted-foreground">
                {h?.hallName} · {s && fmtTime(s.startTime)} {s && fmtDate(s.startTime)}
              </p>
              <p className="mt-2 text-sm">
                Ghế <b>{seatNum}</b> · {vnd(t.price)}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">Mã vé: {t.ticketId}</p>
              <span
                className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                  t.isCheckedIn ? "bg-secondary text-muted-foreground" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {t.isCheckedIn ? "Đã soát" : "Chưa sử dụng"}
              </span>
            </div>
            <div className="flex items-center justify-center border-l-2 border-dashed border-border bg-white p-4">
              <QrCode value={t.ticketId} size={110} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
