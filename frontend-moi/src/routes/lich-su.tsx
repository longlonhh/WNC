import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, Ticket, Calendar, Clock, MapPin, CheckCircle, QrCode as QrIcon } from "lucide-react";
import { vnd, fmtDate, fmtTime } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { api, type ApiBookingHistory } from "@/lib/api";
import { QrCode } from "@/components/QrCode";
import { TicketList } from "./dat-ve.$showtimeId";

export const Route = createFileRoute("/lich-su")({
  head: () => ({
    meta: [
      { title: "Vé của tôi — Lịch sử giao dịch | CineVé" },
      { name: "description", content: "Xem lại các đơn hàng đã đặt và vé điện tử QR." },
      { property: "og:title", content: "Vé của tôi — CineVé" },
      { property: "og:description", content: "Lịch sử giao dịch và vé điện tử." },
    ],
  }),
  component: History,
});

function History() {
  const { user, setShowLoginModal } = useAuth();
  const store = useStore();
  const [realBookings, setRealBookings] = useState<ApiBookingHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.getMyBookings()
        .then((data) => {
          if (Array.isArray(data)) {
            setRealBookings(data);
          }
        })
        .catch((e) => {
          console.warn("Could not load my bookings from backend", e);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Ticket className="mx-auto h-12 w-12 text-muted-foreground/60" />
        <h2 className="mt-4 text-2xl font-bold uppercase">Bạn chưa đăng nhập</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vui lòng đăng nhập để xem lịch sử đặt vé và mã QR vào rạp của bạn.
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold uppercase tracking-wider text-primary-foreground shadow hover:opacity-90 transition"
        >
          <LogIn className="h-4 w-4" /> Đăng nhập ngay
        </button>
      </div>
    );
  }

  const hasReal = realBookings.length > 0;
  const localList = [...store.bookings].reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-wide">Vé của tôi</h1>
          <p className="text-xs text-muted-foreground">
            Lịch sử giao dịch của tài khoản <span className="text-primary font-medium">{user.email}</span>
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
          {hasReal ? realBookings.length : localList.length} giao dịch
        </span>
      </div>

      {loading && (
        <div className="py-16 text-center text-muted-foreground">Đang tải lịch sử giao dịch...</div>
      )}

      {!loading && !hasReal && localList.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <Ticket className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-lg font-semibold">Bạn chưa có đơn đặt vé nào.</p>
          <p className="mt-1 text-xs text-muted-foreground">Khám phá các bộ phim hot đang chiếu và đặt vé ngay hôm nay!</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow hover:opacity-90 transition"
          >
            Đặt vé ngay
          </Link>
        </div>
      )}

      {/* Render Real Backend Bookings */}
      {!loading && hasReal && (
        <div className="space-y-8">
          {realBookings.map((b) => (
            <div key={b.bookingId} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3 text-xs">
                <span className="font-mono text-muted-foreground">
                  Mã đơn: <b className="text-foreground">#{b.bookingId}</b> · {new Date(b.bookingDate).toLocaleString("vi-VN")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    {b.status}
                  </span>
                  <span className="font-display text-lg font-bold text-primary">{vnd(Number(b.totalAmount))}</span>
                </span>
              </div>

              <div className="space-y-3">
                {b.tickets?.map((t) => {
                  const isUsed = Boolean(t.ticketCode && t.ticketCode.endsWith("-USED"));
                  const showtime = t.showtime;
                  const movie = showtime?.movie;
                  const hall = showtime?.hall;
                  const seat = t.seat;

                  return (
                    <div key={t.ticketId} className="flex overflow-hidden rounded-xl border border-border bg-background/50">
                      <div className="flex-1 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Vé điện tử CineVé</p>
                        <h3 className="text-xl font-bold uppercase text-foreground">{movie?.title || "Phim điện ảnh"}</h3>
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                          {hall && <span>Phòng: <b>{hall.hallName}</b></span>}
                          {showtime && <span>Suất: <b>{fmtTime(showtime.startTime)} {fmtDate(showtime.startTime)}</b></span>}
                        </p>
                        <p className="mt-2 text-xs">
                          Ghế: <b className="text-primary text-sm">{seat?.seatNumber || `ID ${t.seatId}`}</b> · {vnd(Number(t.price))}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">Mã vé: {t.ticketCode || `T-${t.ticketId}`}</p>
                        <span
                          className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                            isUsed ? "bg-secondary text-muted-foreground" : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {isUsed ? "Đã soát vé" : "Chưa sử dụng"}
                        </span>
                      </div>
                      <div className="flex items-center justify-center border-l-2 border-dashed border-border bg-white p-3">
                        <QrCode value={t.ticketCode || String(t.ticketId)} size={95} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render Local fallback bookings if no real ones */}
      {!loading && !hasReal && localList.length > 0 && (
        <div className="space-y-8">
          {localList.map((b) => (
            <section key={b.bookingId} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3 text-xs">
                <span className="font-mono text-muted-foreground">
                  Đơn {b.bookingId} · {new Date(b.bookingDate).toLocaleString("vi-VN")} · {b.method}
                </span>
                <span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 mr-2">
                    {b.status}
                  </span>
                  <b className="font-display text-lg text-primary">{vnd(b.totalAmount)}</b>
                </span>
              </div>
              <TicketList bookingId={b.bookingId} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
