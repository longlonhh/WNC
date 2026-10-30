import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Container, Row, Col, Card, Tabs, Tab, Form, Button, Alert, Badge, Table, Spinner, ProgressBar, Modal } from "react-bootstrap";
import { ScanLine, BarChart3, Film, CalendarClock, Plus, Pencil, Trash2 } from "lucide-react";
import {
  checkinTicket,
  fetchAdminSummary,
  fetchRevenueByMovie,
  fetchMovies,
  fetchShowtimes,
  fetchHalls,
  createMovie,
  updateMovie,
  deleteMovie,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  errorMessage,
  type SessionUser,
  type AdminSummary,
  type RevenueByMovie,
  type CheckinResult,
  type Movie,
  type Showtime,
  type Hall,
  type MovieStatus,
} from "@/lib/api";
import { vnd, dateTimeLabel, toDateKey } from "@/lib/format";

type Props = {
  session: SessionUser | null;
  requestLogin: () => Promise<SessionUser | null>;
  notify: (text: string, bg?: "success" | "danger" | "warning" | "info") => void;
};

/** Khu vực nhân viên soát vé + quản trị viên (dashboard doanh thu + quản lý phim/lịch chiếu) */
export default function AdminPanel({ session, requestLogin, notify }: Props) {
  const isStaff = session?.role === "STAFF" || session?.role === "ADMIN";
  const isAdmin = session?.role === "ADMIN";

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; ticket?: CheckinResult["ticket"] } | null>(null);

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [byMovie, setByMovie] = useState<RevenueByMovie[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState("");

  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loadingMgmt, setLoadingMgmt] = useState(false);
  const [mgmtError, setMgmtError] = useState("");

  const [movieModal, setMovieModal] = useState<{ show: boolean; edit?: Movie }>({ show: false });
  const [stModal, setStModal] = useState<{ show: boolean; edit?: Showtime }>({ show: false });
  const [movieForm, setMovieForm] = useState({ title: "", description: "", durationMin: 120, posterUrl: "", trailerUrl: "", releaseDate: "", status: "NOW_SHOWING" as MovieStatus });
  const [stForm, setStForm] = useState({ movieId: 0, hallId: 0, startTime: "", ticketPrice: 100000 });
  const [saving, setSaving] = useState(false);

  const loadStats = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingStats(true);
    setStatsError("");
    try {
      const [s, moviesRev] = await Promise.all([fetchAdminSummary(), fetchRevenueByMovie()]);
      setSummary(s);
      setByMovie(moviesRev);
    } catch (err) {
      setStatsError(errorMessage(err));
    } finally {
      setLoadingStats(false);
    }
  }, [isAdmin]);

  const loadMgmt = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingMgmt(true);
    setMgmtError("");
    try {
      const [m, st, h] = await Promise.all([fetchMovies(), fetchShowtimes(), fetchHalls()]);
      setMovies(m);
      setShowtimes(st.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      setHalls(h);
    } catch (err) {
      setMgmtError(errorMessage(err));
    } finally {
      setLoadingMgmt(false);
    }
  }, [isAdmin]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { void loadMgmt(); }, [loadMgmt]);

  async function handleCheckin(e: FormEvent) {
    e.preventDefault();
    if (checking || !code.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await checkinTicket(code.trim());
      setResult({ ok: true, msg: res.message, ticket: res.ticket });
      notify(`Check-in thành công: ${res.ticket.seatNumber}`, "success");
      setCode("");
    } catch (err) {
      setResult({ ok: false, msg: errorMessage(err) });
      notify(errorMessage(err), "danger");
    } finally {
      setChecking(false);
    }
  }

  function openMovieAdd() {
    setMovieForm({ title: "", description: "", durationMin: 120, posterUrl: "", trailerUrl: "", releaseDate: toDateKey(new Date()), status: "NOW_SHOWING" });
    setMovieModal({ show: true });
  }
  function openMovieEdit(m: Movie) {
    setMovieForm({ title: m.title, description: m.description || "", durationMin: m.durationMin, posterUrl: m.posterUrl || "", trailerUrl: m.trailerUrl || "", releaseDate: m.releaseDate, status: m.status });
    setMovieModal({ show: true, edit: m });
  }
  async function saveMovie() {
    if (saving) return;
    setSaving(true);
    try {
      if (movieModal.edit) await updateMovie(movieModal.edit.movieId, movieForm);
      else await createMovie(movieForm as any);
      notify("Đã lưu phim", "success");
      setMovieModal({ show: false });
      await loadMgmt();
    } catch (err) { notify(errorMessage(err), "danger"); } finally { setSaving(false); }
  }
  async function removeMovie(m: Movie) {
    if (!confirm(`Xóa phim "${m.title}"?`)) return;
    try { await deleteMovie(m.movieId); notify("Đã xóa phim", "success"); await loadMgmt(); }
    catch (err) { notify(errorMessage(err), "danger"); }
  }

  function openStAdd() {
    setStForm({ movieId: movies[0]?.movieId || 0, hallId: halls[0]?.hallId || 0, startTime: "", ticketPrice: 100000 });
    setStModal({ show: true });
  }
  function openStEdit(s: Showtime) {
    const local = new Date(s.startTime);
    const iso = new Date(local.getTime() - local.getTimezoneOffset()*60000).toISOString().slice(0,16);
    setStForm({ movieId: s.movieId, hallId: s.hallId, startTime: iso, ticketPrice: Number(s.ticketPrice) });
    setStModal({ show: true, edit: s });
  }
  async function saveSt() {
    if (saving) return;
    if (!stForm.startTime) return notify("Chọn thời gian chiếu", "warning");
    setSaving(true);
    try {
      const payload = { ...stForm, startTime: new Date(stForm.startTime).toISOString() };
      if (stModal.edit) await updateShowtime(stModal.edit.showtimeId, payload as any);
      else await createShowtime(payload as any);
      notify("Đã lưu lịch chiếu", "success");
      setStModal({ show: false });
      await loadMgmt();
    } catch (err) { notify(errorMessage(err), "danger"); } finally { setSaving(false); }
  }
  async function removeSt(s: Showtime) {
    if (!confirm("Xóa lịch chiếu này?")) return;
    try { await deleteShowtime(s.showtimeId); notify("Đã xóa lịch chiếu", "success"); await loadMgmt(); }
    catch (err) { notify(errorMessage(err), "danger"); }
  }

  /* ---- Chưa đăng nhập hoặc sai vai trò ---- */
  if (!isStaff) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <ScanLine size={40} className="text-primary mb-2" />
                <h5 className="fw-bold">Khu vực nhân viên & quản trị</h5>
                <p className="text-muted small">
                  Vui lòng đăng nhập bằng tài khoản <strong>staff@cinema.vn</strong> hoặc{" "}
                  <strong>admin@cinema.vn</strong> (mật khẩu 123456).
                </p>
                <Button className="btn-bk px-4" onClick={() => void requestLogin()}>
                  Đăng nhập
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  const maxRevenue = byMovie.reduce((m, r) => Math.max(m, Number(r.revenue)), 0) || 1;
  const movieMap = new Map(movies.map(m => [m.movieId, m]));
  const hallMap = new Map(halls.map(h => [h.hallId, h]));

  return (
    <Container className="py-4">
      <Tabs defaultActiveKey={isAdmin ? "movies" : "scan"} className="mb-4">
        <Tab eventKey="scan" title={<span><ScanLine size={16} className="me-1" />Soát vé</span>}>
          <Row className="justify-content-center">
            <Col md={7}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h5 className="fw-bold">Quét / nhập mã vé</h5>
                  <Form onSubmit={handleCheckin} className="d-flex gap-2 mt-3">
                    <Form.Control size="lg" placeholder="CPX-0001-001-..." value={code} onChange={(e) => setCode(e.target.value)} />
                    <Button type="submit" className="btn-bk px-4" disabled={checking || !code.trim()}>
                      {checking ? <Spinner size="sm" animation="border" /> : "Kiểm tra"}
                    </Button>
                  </Form>
                  {result && (
                    <Alert variant={result.ok ? "success" : "danger"} className="mt-3 mb-0">
                      <div className="fw-bold">{result.msg}</div>
                      {result.ticket && <div className="small mt-1">{result.ticket.movieTitle} · {result.ticket.hallName} · Ghế {result.ticket.seatNumber} · {dateTimeLabel(result.ticket.startTime)}</div>}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {isAdmin && (
          <Tab eventKey="movies" title={<span><Film size={16} className="me-1" />Quản lý phim</span>}>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div className="fw-bold">Danh sách phim</div>
                <Button size="sm" className="btn-bk" onClick={openMovieAdd}><Plus size={14} className="me-1" />Thêm phim</Button>
              </Card.Body>
            </Card>
            {loadingMgmt ? <Spinner animation="border" /> : (
              <Table hover responsive className="bg-white shadow-sm rounded">
                <thead><tr><th>ID</th><th>Phim</th><th>Thể loại/TT</th><th>Thời lượng</th><th>Khởi chiếu</th><th>Trạng thái</th><th></th></tr></thead>
                <tbody>
                  {movies.map(m => (
                    <tr key={m.movieId}>
                      <td>{m.movieId}</td>
                      <td className="fw-semibold">{m.title}</td>
                      <td className="small text-muted">{m.description?.slice(0,40)}</td>
                      <td>{m.durationMin}'</td>
                      <td>{m.releaseDate}</td>
                      <td><Badge bg={m.status==="NOW_SHOWING"?"success":"info"}>{m.status==="NOW_SHOWING"?"Đang chiếu":"Sắp chiếu"}</Badge></td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openMovieEdit(m)}><Pencil size={14}/></Button>
                        <Button size="sm" variant="outline-danger" onClick={() => removeMovie(m)}><Trash2 size={14}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Tab>
        )}

        {isAdmin && (
          <Tab eventKey="showtimes" title={<span><CalendarClock size={16} className="me-1" />Lịch chiếu</span>}>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div className="fw-bold">Cập nhật lịch chiếu</div>
                <Button size="sm" className="btn-bk" onClick={openStAdd}><Plus size={14} className="me-1" />Thêm suất chiếu</Button>
              </Card.Body>
            </Card>
            {loadingMgmt ? <Spinner animation="border" /> : (
              <Table hover responsive className="bg-white shadow-sm rounded">
                <thead><tr><th>ID</th><th>Phim</th><th>Phòng</th><th>Bắt đầu</th><th>Giá vé</th><th></th></tr></thead>
                <tbody>
                  {showtimes.map(s => (
                    <tr key={s.showtimeId}>
                      <td>{s.showtimeId}</td>
                      <td>{movieMap.get(s.movieId)?.title || s.movieId}</td>
                      <td>{hallMap.get(s.hallId)?.hallName || s.hallId}</td>
                      <td>{dateTimeLabel(s.startTime)}</td>
                      <td>{vnd(s.ticketPrice)}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openStEdit(s)}><Pencil size={14}/></Button>
                        <Button size="sm" variant="outline-danger" onClick={() => removeSt(s)}><Trash2 size={14}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Tab>
        )}

        {isAdmin && (
          <Tab eventKey="dash" title={<span><BarChart3 size={16} className="me-1" />Dashboard</span>}>
            {loadingStats ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> : statsError ? <Alert variant="danger">{statsError}</Alert> : (
              <>
                <Row className="g-3 mb-4">
                  {[["Doanh thu", vnd(summary?.totalRevenue??0)], ["Vé đã bán", String(summary?.ticketsSold??0)], ["Đơn hàng", String(summary?.totalBookings??0)], ["Khách hàng", String(summary?.totalCustomers??0)]].map(([l,v])=>(
                    <Col md={3} key={l as string}><Card className="border-0 shadow-sm"><Card.Body><div className="small text-muted">{l}</div><div className="fs-4 fw-bold" style={{color:"var(--bk-navy)"}}>{v}</div></Card.Body></Card></Col>
                  ))}
                </Row>
                <Card className="border-0 shadow-sm"><Card.Body>
                  <h6 className="fw-bold">Doanh thu theo phim</h6>
                  <Table hover responsive size="sm" className="mb-0">
                    <thead><tr><th>Phim</th><th>Vé bán</th><th style={{minWidth:180}}>Doanh thu</th><th>Tổng</th></tr></thead>
                    <tbody>
                      {byMovie.length===0 && <tr><td colSpan={4} className="text-muted text-center">Chưa có giao dịch</td></tr>}
                      {byMovie.map(m=>(
                        <tr key={m.movieId}><td>{m.title}</td><td>{m.ticketsSold}</td><td><ProgressBar now={(Number(m.revenue)/maxRevenue)*100} variant="success" style={{height:10}}/></td><td className="fw-semibold">{vnd(m.revenue)}</td></tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body></Card>
              </>
            )}
          </Tab>
        )}
      </Tabs>

      <Modal show={movieModal.show} onHide={()=>setMovieModal({show:false})} centered>
        <Modal.Header closeButton><Modal.Title>{movieModal.edit?"Sửa phim":"Thêm phim"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2"><Form.Label>Tên phim</Form.Label><Form.Control value={movieForm.title} onChange={e=>setMovieForm({...movieForm,title:e.target.value})}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label>Mô tả</Form.Label><Form.Control as="textarea" rows={2} value={movieForm.description} onChange={e=>setMovieForm({...movieForm,description:e.target.value})}/></Form.Group>
          <Row>
            <Col><Form.Group className="mb-2"><Form.Label>Thời lượng (phút)</Form.Label><Form.Control type="number" value={movieForm.durationMin} onChange={e=>setMovieForm({...movieForm,durationMin:+e.target.value})}/></Form.Group></Col>
            <Col><Form.Group className="mb-2"><Form.Label>Khởi chiếu</Form.Label><Form.Control type="date" value={movieForm.releaseDate} onChange={e=>setMovieForm({...movieForm,releaseDate:e.target.value})}/></Form.Group></Col>
          </Row>
          <Form.Group className="mb-2"><Form.Label>Poster URL</Form.Label><Form.Control value={movieForm.posterUrl} onChange={e=>setMovieForm({...movieForm,posterUrl:e.target.value})}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label>Trailer URL</Form.Label><Form.Control value={movieForm.trailerUrl} onChange={e=>setMovieForm({...movieForm,trailerUrl:e.target.value})}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label>Trạng thái</Form.Label><Form.Select value={movieForm.status} onChange={e=>setMovieForm({...movieForm,status:e.target.value as MovieStatus})}><option value="NOW_SHOWING">Đang chiếu</option><option value="COMING_SOON">Sắp chiếu</option><option value="ENDED">Kết thúc</option></Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setMovieModal({show:false})}>Hủy</Button>
          <Button className="btn-bk" disabled={saving} onClick={saveMovie}>{saving?"Đang lưu...":"Lưu"}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={stModal.show} onHide={()=>setStModal({show:false})} centered>
        <Modal.Header closeButton><Modal.Title>{stModal.edit?"Sửa lịch chiếu":"Thêm suất chiếu"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2"><Form.Label>Phim</Form.Label><Form.Select value={stForm.movieId} onChange={e=>setStForm({...stForm,movieId:+e.target.value})}>{movies.map(m=><option key={m.movieId} value={m.movieId}>{m.title}</option>)}</Form.Select></Form.Group>
          <Form.Group className="mb-2"><Form.Label>Phòng</Form.Label><Form.Select value={stForm.hallId} onChange={e=>setStForm({...stForm,hallId:+e.target.value})}>{halls.map(h=><option key={h.hallId} value={h.hallId}>{h.hallName}</option>)}</Form.Select></Form.Group>
          <Form.Group className="mb-2"><Form.Label>Thời gian bắt đầu</Form.Label><Form.Control type="datetime-local" value={stForm.startTime} onChange={e=>setStForm({...stForm,startTime:e.target.value})}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label>Giá vé</Form.Label><Form.Control type="number" value={stForm.ticketPrice} onChange={e=>setStForm({...stForm,ticketPrice:+e.target.value})}/></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setStModal({show:false})}>Hủy</Button>
          <Button className="btn-bk" disabled={saving} onClick={saveSt}>{saving?"Đang lưu...":"Lưu"}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
