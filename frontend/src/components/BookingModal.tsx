import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Button, Card, Row, Col, Badge, Alert, Spinner, Form, Table } from "react-bootstrap";
import {
  fetchShowtimes,
  fetchSeatStatus,
  createBooking,
  createPaymentRequest,
  confirmPayment,
  errorMessage,
  type Movie,
  type Showtime,
  type SeatInfo,
  type PaymentMethod,
  type PaymentResult,
  type SessionUser,
} from "@/lib/api";
import { vnd, toDateKey, dateLabel, timeLabel, dateTimeLabel, POSTER_FALLBACK, onPosterError } from "@/lib/format";

type Step = "showtime" | "seats" | "ticket";

type Props = {
  movie: Movie;
  session: SessionUser | null;
  /** Mở hộp thoại đăng nhập, trả về user nếu đăng nhập thành công (null nếu hủy) */
  requestLogin: () => Promise<SessionUser | null>;
  notify: (text: string, bg?: "success" | "danger" | "warning" | "info") => void;
  onClose: () => void;
};

const MAX_SEATS = 8;
const STEPS: Array<{ key: Step; label: string }> = [
  { key: "showtime", label: "Chọn suất" },
  { key: "seats", label: "Chọn ghế" },
  { key: "ticket", label: "Vé điện tử" },
];

/**
 * Hộp thoại đặt vé — toàn bộ nghiệp vụ gói trong đúng 4 thao tác:
 *   1. Bấm "Đặt vé" trên phim  → mở hộp thoại, suất chiếu tự tải, ngày tự chọn sẵn
 *   2. Bấm một giờ chiếu        → sơ đồ ghế tải real-time
 *   3. Bấm ghế                  → tổng tiền tự tính theo loại ghế
 *   4. Bấm "Thanh toán"         → giữ ghế + tạo giao dịch + xác nhận diễn ra tự động
 * Không có màn hình thừa, không cửa sổ bật lên làm phiền.
 */
export default function BookingModal({ movie, session, requestLogin, notify, onClose }: Props) {
  const [step, setStep] = useState<Step>("showtime");
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [dateKey, setDateKey] = useState<string>("");
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("MOMO");
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  /* ---- Tải toàn bộ suất còn hiệu lực của phim (mỗi phim chỉ gọi 1 lần) ---- */
  useEffect(() => {
    let alive = true;
    setLoadingShowtimes(true);
    fetchShowtimes({ movieId: movie.movieId })
      .then((list) => {
        if (!alive) return;
        const now = Date.now();
        const future = list
          .filter((s) => new Date(s.startTime).getTime() > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setShowtimes(future);
        // Thông minh: tự chọn ngày chiếu sớm nhất còn suất (tính theo thời gian thực)
        setDateKey(future[0] ? toDateKey(future[0].startTime) : toDateKey(new Date()));
      })
      .catch((err) => notify(errorMessage(err), "danger"))
      .finally(() => alive && setLoadingShowtimes(false));
    return () => {
      alive = false;
    };
  }, [movie.movieId, notify]);

  const dateKeys = useMemo(() => {
    const keys = new Set<string>();
    showtimes.forEach((s) => keys.add(toDateKey(s.startTime)));
    return [...keys];
  }, [showtimes]);

  const dayShowtimes = useMemo(
    () => showtimes.filter((s) => toDateKey(s.startTime) === dateKey),
    [showtimes, dateKey],
  );

  const total = useMemo(
    () =>
      selected.reduce((sum, id) => {
        const seat = seats.find((s) => s.seatId === id);
        return sum + Number(seat?.price ?? 0);
      }, 0),
    [selected, seats],
  );

  const selectedNumbers = useMemo(
    () =>
      seats
        .filter((s) => selected.includes(s.seatId))
        .map((s) => s.seatNumber)
        .sort(),
    [seats, selected],
  );

  /** Gom suất chiếu theo phòng chiếu để hiển thị thành từng nhóm */
  const hallNames = useMemo(() => {
    const names: string[] = [];
    dayShowtimes.forEach((st) => {
      const name = st.hall?.hallName ?? `Phòng ${st.hallId}`;
      if (!names.includes(name)) names.push(name);
    });
    return names;
  }, [dayShowtimes]);

  const seatRows = useMemo(() => {
    const map = new Map<string, SeatInfo[]>();
    seats.forEach((seat) => {
      const m = seat.seatNumber.match(/^[A-Za-z]+/);
      const row = m ? m[0] : "#";
      map.set(row, [...(map.get(row) ?? []), seat]);
    });
    return [...map.entries()];
  }, [seats]);

  /* ---- Bước 2: mở sơ đồ ghế ---- */
  const openSeats = useCallback(
    async (st: Showtime) => {
      setShowtime(st);
      setSelected([]);
      setStep("seats");
      setLoadingSeats(true);
      try {
        setSeats(await fetchSeatStatus(st.showtimeId));
      } catch (err) {
        notify(errorMessage(err), "danger");
        setSeats([]);
      } finally {
        setLoadingSeats(false);
      }
    },
    [notify],
  );

  function toggleSeat(seat: SeatInfo) {
    if (seat.status === "SOLD") return notify(`Ghế ${seat.seatNumber} đã có người đặt`, "warning");
    if (seat.status === "HELD") return notify(`Ghế ${seat.seatNumber} đang được giữ tạm thời`, "warning");
    setSelected((cur) => {
      if (cur.includes(seat.seatId)) return cur.filter((id) => id !== seat.seatId);
      if (cur.length >= MAX_SEATS) {
        notify(`Tối đa ${MAX_SEATS} ghế mỗi đơn`, "warning");
        return cur;
      }
      return [...cur, seat.seatId];
    });
  }

  /* ---- Bước 4: thanh toán 1 chạm (3 lời gọi API nối tiếp chạy tự động) ---- */
  async function pay() {
    if (paying || !showtime || selected.length === 0) return;
    setPaying(true);
    try {
      const user = session ?? (await requestLogin());
      if (!user) {
        setPaying(false);
        return;
      }
      const draft = await createBooking(
        showtime.showtimeId,
        selected.map((id) => id),
      );
      const payment = await createPaymentRequest(draft.bookingId, method);
      const paid = await confirmPayment(draft.bookingId, true, payment.transactionId);
      setResult(paid);
      setStep("ticket");
      notify("Đặt vé thành công! Vé điện tử đã được tạo.", "success");
    } catch (err) {
      notify(errorMessage(err), "danger");
      // Ghế có thể vừa bị người khác đặt → làm mới sơ đồ để chọn lại
      openSeats(showtime);
    } finally {
      setPaying(false);
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Modal show centered size="xl" backdrop="static" onHide={onClose} aria-label="Đặt vé">
      <Modal.Header closeButton className="pb-2">
        <div className="w-100">
          <div className="fw-bold fs-5">{movie.title}</div>
          <div className="d-flex flex-wrap gap-4 mt-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className={`bk-step ${stepIndex === i ? "active" : stepIndex > i ? "done" : ""}`}>
                <span className="dot">{stepIndex > i ? "✓" : i + 1}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {/* ================= BƯỚC 1: CHỌN SUẤT ================= */}
        {step === "showtime" && (
          <>
            {loadingShowtimes ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="text-muted small mt-2">Đang tải suất chiếu...</div>
              </div>
            ) : dayShowtimes.length === 0 ? (
              <Alert variant="secondary">
                {dateKeys.length === 0
                  ? "Phim này hiện chưa có suất chiếu. Vui lòng quay lại sau."
                  : "Ngày này chưa có suất chiếu — chọn ngày khác bên dưới."}
              </Alert>
            ) : null}

            {dateKeys.length > 1 && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {dateKeys.map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={key === dateKey ? "primary" : "outline-primary"}
                    onClick={() => setDateKey(key)}
                  >
                    {dateLabel(key)}
                  </Button>
                ))}
              </div>
            )}

            {hallNames.map((hallName) => (
              <Card key={hallName} className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <div className="fw-semibold mb-2">{hallName}</div>
                  <div className="d-flex flex-wrap gap-2">
                    {dayShowtimes
                      .filter((st) => (st.hall?.hallName ?? `Phòng ${st.hallId}`) === hallName)
                      .map((st, idx) => (
                        <Button
                          key={st.showtimeId}
                          variant={idx === 0 ? "primary" : "outline-primary"}
                          onClick={() => openSeats(st)}
                        >
                          {timeLabel(st.startTime)}
                          <span className="ms-2 small opacity-75">{vnd(st.ticketPrice)}</span>
                          {idx === 0 && (
                            <Badge bg="warning" text="dark" className="ms-2">
                              Gần nhất
                            </Badge>
                          )}
                        </Button>
                      ))}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </>
        )}

        {/* ================= BƯỚC 2: CHỌN GHẾ ================= */}
        {step === "seats" && showtime && (
          <Row className="g-4">
            <Col lg={7}>
              <Button variant="link" className="px-0 mb-2" onClick={() => setStep("showtime")}>
                ← Đổi suất chiếu
              </Button>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="bk-screen mx-auto mb-4" style={{ width: "85%" }}>
                    MÀN HÌNH
                  </div>

                  {loadingSeats ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <div className="text-muted small mt-2">Đang tải sơ đồ ghế...</div>
                    </div>
                  ) : (
                    <div className="overflow-auto pb-2">
                      {seatRows.map(([row, rowSeats]) => (
                        <div key={row} className="d-flex justify-content-center align-items-center flex-nowrap">
                          <span className="text-muted small me-2" style={{ width: 14 }}>
                            {row}
                          </span>
                          {rowSeats.map((seat) => {
                            const isSelected = selected.includes(seat.seatId);
                            const stateClass =
                              seat.status === "SOLD" ? "booked" : seat.status === "HELD" ? "locked" : "";
                            return (
                              <button
                                key={seat.seatId}
                                type="button"
                                aria-label={`Ghế ${seat.seatNumber}`}
                                title={`${seat.seatNumber} · ${vnd(seat.price)}`}
                                className={`seat ${seat.seatType.toLowerCase()} ${isSelected ? "selected" : stateClass}`}
                                onClick={() => toggleSeat(seat)}
                              >
                                {seat.seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-3 justify-content-center mt-3 small">
                    {[
                      ["", "Thường"],
                      ["vip", "VIP (x1.5)"],
                      ["couple", "Đôi (x2)"],
                      ["selected", "Đang chọn"],
                      ["booked", "Đã bán"],
                      ["locked", "Đang giữ tạm"],
                    ].map(([cls, label]) => (
                      <span key={label} className="d-flex align-items-center gap-1">
                        <span className={`seat ${cls}`} style={{ width: 22, height: 18, cursor: "default" }} />
                        {label}
                      </span>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="border-0 shadow-sm" style={{ position: "sticky", top: 0 }}>
                <Card.Body>
                  <div className="d-flex gap-3 mb-3">
                    <img
                      src={movie.posterUrl || POSTER_FALLBACK}
                      onError={onPosterError}
                      alt=""
                      width={64}
                      height={92}
                      className="rounded"
                      style={{ objectFit: "cover" }}
                    />
                    <div>
                      <div className="fw-bold">{movie.title}</div>
                      <div className="small text-muted">{movie.durationMin} phút</div>
                    </div>
                  </div>

                  <Table size="sm" borderless className="mb-0 small">
                    <tbody>
                      <tr>
                        <td className="text-muted">Phòng</td>
                        <td className="text-end">{showtime.hall?.hallName ?? `Phòng ${showtime.hallId}`}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Suất</td>
                        <td className="text-end">
                          {dateTimeLabel(showtime.startTime)}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Ghế ({selected.length})</td>
                        <td className="text-end fw-semibold">
                          {selectedNumbers.length ? selectedNumbers.join(", ") : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </Table>

                  <Form.Select
                    size="sm"
                    className="mt-2"
                    aria-label="Phương thức thanh toán"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="MOMO">Ví MoMo — QR</option>
                    <option value="VNPAY">VNPay — QR ngân hàng</option>
                  </Form.Select>

                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Tổng tiền</span>
                    <span className="fw-bold fs-4" style={{ color: "var(--bk-navy)" }}>
                      {vnd(total)}
                    </span>
                  </div>

                  <Button
                    className="btn-bk w-100 py-2 mt-3"
                    size="lg"
                    disabled={paying || selected.length === 0}
                    onClick={pay}
                  >
                    {paying ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Đang thanh toán...
                      </>
                    ) : (
                      `Thanh toán ${vnd(total)}`
                    )}
                  </Button>
                  {paying && (
                    <div className="small text-muted text-center mt-2">
                      Giữ ghế → tạo giao dịch → xác nhận vé, chỉ cần chờ một chút.
                    </div>
                  )}
                  <div className="small text-muted text-center mt-2">
                    Ghế được giữ trong 8 phút tính từ khi tạo đơn.
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* ================= BƯỚC 3: VÉ ĐIỆN TỬ ================= */}
        {step === "ticket" && result && showtime && (
          <div className="text-center">
            <div className="fs-4 fw-bold text-success mb-1">Đặt vé thành công!</div>
            <div className="text-muted small mb-3">
              Xuất trình mã QR tại quầy soát vé — mã cũng đã gửi tới email của bạn.
            </div>

            <div className="d-flex flex-wrap justify-content-center gap-3 mb-3">
              {result.tickets.map((t) => (
                <Card key={t.ticketCode} className="border-0 shadow-sm" style={{ width: 210 }}>
                  <Card.Body className="text-center">
                    <img src={t.qrDataUrl} alt={`QR ${t.seatNumber}`} width={150} height={150} />
                    <div className="fw-bold mt-2" style={{ letterSpacing: 1 }}>
                      {t.seatNumber}
                    </div>
                    <div className="small text-muted text-break">{t.ticketCode}</div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            <Card className="bk-ticket text-start">
              <Card.Body>
                <Table size="sm" className="mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted">Phim</td>
                      <td className="fw-semibold">{movie.title}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Phòng</td>
                      <td>{showtime.hall?.hallName ?? `Phòng ${showtime.hallId}`}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Suất</td>
                      <td>{dateTimeLabel(showtime.startTime)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Ghế</td>
                      <td>{selectedNumbers.join(", ")}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Đã thanh toán</td>
                      <td className="fw-bold">
                        {vnd(result.totalAmount)} ({method === "MOMO" ? "MoMo" : "VNPay"})
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            <Button className="btn-bk mt-4 px-5 py-2" onClick={onClose}>
              Hoàn tất
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
