import { useCallback, useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Navbar,
  Nav,
  Form,
  Toast,
  ToastContainer,
  Badge,
  Spinner,
  Alert,
  Dropdown,
} from "react-bootstrap";
import { Film, Clock, Calendar, ScanLine, UserRound } from "lucide-react";
import {
  fetchMovies,
  getSession,
  clearSession,
  errorMessage,
  type Movie,
  type MovieStatus,
  type SessionUser,
} from "@/lib/api";
import { POSTER_FALLBACK, onPosterError } from "@/lib/format";
import BookingModal from "./BookingModal";
import AuthModal from "./AuthModal";
import AdminPanel from "./AdminPanel";

type ToastMsg = { id: number; bg: string; text: string };
type Tab = Extract<MovieStatus, "NOW_SHOWING" | "COMING_SOON">;

/**
 * CineBook — giao diện đặt vé (react-bootstrap) kết nối NestJS backend.
 *
 * Nguyên tắc usability:
 *  - Nghiệp vụ chính (chọn phim → chọn suất → chọn ghế → thanh toán) gói gọn trong 4 thao tác.
 *  - Tự động hóa phần lớn việc: ngày/giờ tự gợi ý, tài khoản giữ phiên, thanh toán 1 chạm.
 *  - Không hiển thị gây phiền nhiễu: chỉ toast tự tắt ở góc màn hình, không popup quảng cáo.
 */
export default function CinemaApp() {
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const [session, setSession] = useState<SessionUser | null>(() => getSession());
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [moviesError, setMoviesError] = useState("");
  const [tab, setTab] = useState<Tab>("NOW_SHOWING");
  const [query, setQuery] = useState("");
  const [bookingMovie, setBookingMovie] = useState<Movie | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const loginResolver = useRef<((user: SessionUser | null) => void) | null>(null);

  const notify = useCallback((text: string, bg: "success" | "danger" | "warning" | "info" = "success") => {
    setToasts((cur) => [...cur, { id: Date.now() + Math.random(), bg, text }]);
  }, []);

  /* ------------------------- tải danh sách phim ------------------------- */
  useEffect(() => {
    let alive = true;
    fetchMovies()
      .then((list) => alive && setMovies(list))
      .catch((err) => alive && setMoviesError(errorMessage(err)))
      .finally(() => alive && setLoadingMovies(false));
    return () => {
      alive = false;
    };
  }, []);

  /* --------------------------- phiên đăng nhập --------------------------- */
  const requestLogin = useCallback(
    () =>
      new Promise<SessionUser | null>((resolve) => {
        loginResolver.current?.(null); // bỏ qua lời chờ trước đó (nếu có)
        loginResolver.current = resolve;
        setAuthOpen(true);
      }),
    [],
  );

  const finishAuth = useCallback((user: SessionUser | null) => {
    setAuthOpen(false);
    if (user) {
      setSession(user);
      if (user.role === "ADMIN" || user.role === "STAFF") {
        setMode("admin");
      } else {
        setMode("customer");
      }
    }
    const resolve = loginResolver.current;
    loginResolver.current = null;
    resolve?.(user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setMode("customer");
    notify("Đã đăng xuất.", "info");
  }, [notify]);

  /* ------------------------------ dữ liệu ------------------------------ */
  const visibleMovies = movies.filter(
    (m) =>
      m.status === tab &&
      (query.trim() === "" || m.title.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const goHome = () => {
    setBookingMovie(null);
    setMode("customer");
  };

  const canBook = session?.role === "CUSTOMER";

  const roleLabel = session?.role === "ADMIN" ? "Quản trị" : session?.role === "STAFF" ? "Nhân viên" : "Khách hàng";

  return (
    <div className="bk-app" style={{ background: "var(--bk-soft)", minHeight: "100vh" }}>
      {/* ============================ NAVBAR ============================ */}
      <Navbar variant="dark" className="bk-nav py-3" expand="md">
        <Container>
          <Navbar.Brand className="fw-bold fs-4" style={{ cursor: "pointer" }} onClick={goHome}>
            <Film size={26} className="me-2" />
            CineBook<span style={{ color: "var(--bk-yellow)" }}>.vn</span>
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center gap-2">
            {(session?.role === "CUSTOMER" || !session) && (
              <Button
                size="sm"
                variant={mode === "customer" ? "light" : "outline-light"}
                onClick={() => setMode("customer")}
              >
                Đặt vé
              </Button>
            )}
            {(session?.role === "ADMIN" || session?.role === "STAFF") && (
              <Button
                size="sm"
                variant={mode === "admin" ? "light" : "outline-light"}
                onClick={() => setMode("admin")}
              >
                <ScanLine size={14} className="me-1" />
                Quản trị & Soát vé
              </Button>
            )}

            {session ? (
              <Dropdown align="end">
                <Dropdown.Toggle size="sm" variant="outline-light" id="user-menu">
                  <UserRound size={14} className="me-1" />
                  {session.fullName}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>
                    {roleLabel} · {session.email}
                  </Dropdown.Header>
                  <Dropdown.Item onClick={logout}>Đăng xuất</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button size="sm" variant="warning" className="fw-semibold" onClick={() => void requestLogin()}>
                Đăng nhập
              </Button>
            )}
          </Nav>
        </Container>
      </Navbar>

      {mode === "admin" ? (
        <AdminPanel session={session} requestLogin={requestLogin} notify={notify} />
      ) : (
        <>
          {/* ============================ HERO ============================ */}
          <div className="bk-hero">
            <Container>
              <h1 className="fw-bold display-6">Đặt vé xem phim đúng 4 thao tác</h1>
              <p className="fs-5 opacity-75 mb-0">
              </p>
            </Container>
          </div>

          <Container>
            {/* ====================== thanh tìm kiếm ====================== */}
            <div className="bk-search shadow">
              <Row className="g-1">
                <Col md={9}>
                  <Form.Control
                    placeholder="Tìm tên phim... "
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Tìm phim"
                  />
                </Col>
                <Col md={3} className="d-flex align-items-center justify-content-center fw-semibold">
                   {visibleMovies.length} phim phù hợp
                </Col>
              </Row>
            </div>

            {/* ========================= danh sách phim ========================= */}
            <div className="d-flex align-items-center justify-content-between mt-5 mb-3 flex-wrap gap-2">
              <h3 className="fw-bold mb-0">Danh sách phim</h3>
              <Nav variant="pills" activeKey={tab} onSelect={(k) => setTab((k as Tab) ?? "NOW_SHOWING")}>
                <Nav.Item>
                  <Nav.Link eventKey="NOW_SHOWING">Đang chiếu</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="COMING_SOON">Sắp chiếu</Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            {loadingMovies ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="text-muted small mt-2">Đang tải danh sách phim...</div>
              </div>
            ) : moviesError ? (
              <Alert variant="danger">
                {moviesError}
                <div className="small mt-1">
                  Hãy chạy backend trước: <code>cd backend && npm run start:dev</code>
                </div>
              </Alert>
            ) : (
              <Row xs={1} sm={2} lg={4} className="g-4 pb-5">
                {visibleMovies.map((m) => (
                  <Col key={m.movieId}>
                    <Card
                      className={`bk-card h-100 border-0 shadow-sm ${m.status === "NOW_SHOWING" && canBook ? "" : "opacity-75"}`}
                      onClick={() => m.status === "NOW_SHOWING" && canBook && setBookingMovie(m)}
                    >
                      <Card.Img
                        variant="top"
                        src={m.posterUrl || POSTER_FALLBACK}
                        onError={onPosterError}
                        alt={m.title}
                        className="bk-poster"
                      />
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <Card.Title className="fs-6 fw-bold" style={{ color: "var(--bk-blue)" }}>
                            {m.title}
                          </Card.Title>
                          <Badge bg={m.status === "NOW_SHOWING" ? "success" : "info"}>
                            {m.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu"}
                          </Badge>
                        </div>
                        <div className="small text-muted mb-2">
                          <Clock size={12} /> {m.durationMin} phút
                        </div>
                        <div className="small text-muted mb-2">
                          <Calendar size={12} /> Khởi chiếu {String(m.releaseDate).split("-").reverse().join("/")}
                        </div>
                        <div className="mt-auto">
                          {m.status === "NOW_SHOWING" && canBook ? (
                            <Button
                              className="btn-bk w-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookingMovie(m);
                              }}
                            >
                              Đặt vé
                            </Button>
                          ) : m.status === "NOW_SHOWING" && !canBook ? (
                            <div className="small text-center text-muted">
                              {session ? "Chỉ khách hàng mới được mua vé" : "Đăng nhập bằng tài khoản khách hàng để mua vé"}
                            </div>
                          ) : (
                            <div className="small text-center text-muted">Sắp ra rạp</div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
                {visibleMovies.length === 0 && (
                  <Col>
                    <Alert variant="light">Không tìm thấy phim phù hợp.</Alert>
                  </Col>
                )}
              </Row>
            )}
          </Container>
        </>
      )}

      {/* ============================ OVERLAY ============================ */}
      {bookingMovie && (
        <BookingModal
          movie={bookingMovie}
          session={session}
          requestLogin={requestLogin}
          notify={notify}
          onClose={() => setBookingMovie(null)}
        />
      )}

      <AuthModal show={authOpen} onHide={() => finishAuth(null)} onAuthed={finishAuth} />

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={t.bg}
            autohide
            delay={3000}
            onClose={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
          >
            <Toast.Body className={t.bg === "warning" || t.bg === "info" ? "" : "text-white"}>{t.text}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </div>
  );
}
