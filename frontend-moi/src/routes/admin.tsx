import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, ShieldAlert, RefreshCw } from "lucide-react";
import { fmtDate, fmtTime, vnd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { api, type AdminSummary, type RevenueByMovieItem, type RevenueByHallItem, type ApiMovie, type ApiHall, type ApiShowtime } from "@/lib/api";

function SimpleBarChart({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-[260px] items-end gap-3 overflow-x-auto px-1 pb-1">
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, 2);
        return (
          <div key={d.name} className="flex min-w-[56px] flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">{vnd(d.value)}</span>
            <div className="flex h-44 w-full items-end justify-center">
              <div
                className="w-full max-w-[48px] rounded-t-md bg-primary transition-all"
                style={{ height: `${pct}%` }}
                title={`${d.name}: ${vnd(d.value)}`}
              />
            </div>
            <span className="line-clamp-2 max-w-[72px] text-center text-[10px] leading-tight text-muted-foreground">
              {d.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/admin" as const)({
  head: () => ({
    meta: [
      { title: "Quản trị rạp — CineVé" },
      { name: "description", content: "Quản lý phim, phòng chiếu, suất chiếu và thống kê doanh thu." },
      { property: "og:title", content: "Quản trị — CineVé" },
      { property: "og:description", content: "Bảng điều khiển quản trị rạp chiếu phim." },
    ],
  }),
  component: Admin,
});

const tabs = ["Thống kê", "Phim", "Phòng chiếu", "Suất chiếu"] as const;
const input = "rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-lg bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow hover:opacity-90 transition";

function Admin() {
  const { user, quickLogin } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Thống kê");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isAdmin = Boolean(user && (user.role as string) === "ADMIN");

  const handleQuickAdminLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await quickLogin("ADMIN");
    } catch (err: any) {
      setLoginError(err?.message || "Đăng nhập thất bại. Kiểm tra backend có đang chạy không.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-wide">Quản trị hệ thống</h1>
          <p className="text-xs text-muted-foreground">Theo dõi doanh thu, quản lý phim, phòng chiếu và suất chiếu</p>
        </div>
        {user && (
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            {user.fullName} ({user.role})
          </span>
        )}
      </div>

      {!isAdmin && (
        <div className="my-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>Khu vực giới hạn — Cần quyền Quản trị viên (ADMIN) để thao tác với CSDL</span>
          </div>
          <p className="text-muted-foreground">
            Bạn có thể đăng nhập bằng tài khoản quản trị mẫu bên dưới để xem toàn bộ số liệu CSDL thực tế:
          </p>
          {loginError && (
            <p className="mt-2 text-rose-400 font-medium">❌ {loginError}</p>
          )}
          <button
            disabled={loginLoading}
            onClick={handleQuickAdminLogin}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 font-bold uppercase tracking-wider text-black shadow hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="h-4 w-4" />
            {loginLoading ? "Đang đăng nhập..." : "Đăng nhập Admin (admin@cinema.vn)"}
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="my-6 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === "Thống kê" && <Stats isAdmin={isAdmin} />}
      {tab === "Phim" && <MoviesManagement isAdmin={isAdmin} />}
      {tab === "Phòng chiếu" && <HallsManagement isAdmin={isAdmin} />}
      {tab === "Suất chiếu" && <ShowtimesManagement isAdmin={isAdmin} />}
    </div>
  );
}

function Stats({ isAdmin }: { isAdmin: boolean }) {
  const store = useStore();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [byMovie, setByMovie] = useState<RevenueByMovieItem[]>([]);
  const [byHall, setByHall] = useState<RevenueByHallItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadBackendStats = () => {
    if (!isAdmin) return;
    setLoading(true);
    setApiError(null);
    Promise.all([
      api.getAdminSummary().catch((e: any) => { setApiError(e?.message || "Lỗi không xác định"); return null; }),
      api.getRevenueByMovie().catch(() => [] as RevenueByMovieItem[]),
      api.getRevenueByHall().catch(() => [] as RevenueByHallItem[]),
    ]).then(([sum, movies, halls]) => {
      if (sum) setSummary(sum);
      setByMovie((movies as RevenueByMovieItem[]) || []);
      setByHall((halls as RevenueByHallItem[]) || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadBackendStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Fallback to local store calculations if not admin or backend stats empty
  const localRevenue = store.bookings.reduce((s, b) => s + b.totalAmount, 0);
  const localByMovie = store.movies.map((m) => ({
    name: m.title,
    value: store.tickets.filter((t) => store.showtimes.find((s) => s.showtimeId === t.showtimeId)?.movieId === m.movieId).reduce((s, t) => s + t.price, 0),
  })).filter((x) => x.value > 0);

  const localByHall = store.halls.map((h) => ({
    name: h.hallName,
    value: store.tickets.filter((t) => store.showtimes.find((s) => s.showtimeId === t.showtimeId)?.hallId === h.hallId).reduce((s, t) => s + t.price, 0),
  })).filter((x) => x.value > 0);

  const cards: [string, string][] = summary
    ? [
        ["Tổng doanh thu thực tế", vnd(summary.totalRevenue)],
        ["Vé đã bán ra", String(summary.ticketsSold ?? 0)],
        ["Đơn đặt vé", String(summary.totalBookings ?? 0)],
        ["Khách hàng đăng ký", String(summary.totalCustomers ?? 0)],
      ]
    : [
        ["Tổng doanh thu", vnd(localRevenue)],
        ["Đơn hàng", String((store as any).bookings?.length ?? 0)],
        ["Vé đã bán", String((store as any).tickets?.length ?? 0)],
        ["Đã check-in", String(((store as any).tickets ?? []).filter((t: any) => t?.isCheckedIn).length)],
      ];

  const chartMovieData: { name: string; value: number }[] = byMovie.length > 0
    ? byMovie.map((m) => ({ name: m.title, value: m.revenue }))
    : localByMovie.map((x) => ({ name: x.name ?? "", value: x.value ?? 0 }));

  const chartHallData: { name: string; value: number }[] = byHall.length > 0
    ? byHall.map((h) => ({ name: h.hallName, value: h.revenue }))
    : localByHall.map((x) => ({ name: x.name ?? "", value: x.value ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {apiError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Lỗi kết nối backend: <b>{apiError}</b></span>
          </div>
        )}
        <button
          onClick={loadBackendStats}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Làm mới dữ liệu
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{l}</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[
          ["Doanh thu theo phim", chartMovieData],
          ["Doanh thu theo phòng chiếu", chartHallData],
        ].map(([title, data]) => {
          const arrData: { name: string; value: number }[] = (data as { name: string; value: number }[]) ?? [];
          return (
            <div key={title as string} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold uppercase tracking-wide">{title as string}</h2>
              {arrData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu thống kê — hãy đặt thử vé xem phim để ghi nhận doanh thu.
                </p>
              ) : (
                <SimpleBarChart data={arrData} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MoviesManagement({ isAdmin }: { isAdmin: boolean }) {
  const store = useStore();
  const [realMovies, setRealMovies] = useState<ApiMovie[]>([]);
  const [f, setF] = useState({
    title: "",
    durationMin: 120,
    genre: "Hành động",
    releaseDate: new Date().toISOString().slice(0, 10),
    description: "",
    posterUrl: "",
    status: "NOW_SHOWING",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadMovies = () => {
    api.getMovies()
      .then((data) => setRealMovies(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title) return;
    setLoading(true);
    setMsg("");

    try {
      if (isAdmin) {
        await api.createMovie({
          title: f.title,
          description: f.description,
          durationMin: Number(f.durationMin),
          posterUrl: f.posterUrl || "https://image.tmdb.org/t/p/w500/avatar3.jpg",
          releaseDate: f.releaseDate,
          status: f.status,
        });
        setMsg("Đã thêm phim mới thành công vào CSDL!");
        loadMovies();
        setF({
          title: "",
          durationMin: 120,
          genre: "Hành động",
          releaseDate: new Date().toISOString().slice(0, 10),
          description: "",
          posterUrl: "",
          status: "NOW_SHOWING",
        });
      } else {
        store.set((s) => ({
          ...s,
          movies: [
            ...s.movies,
            {
              movieId: "m_" + Date.now(),
              title: f.title,
              durationMin: f.durationMin,
              genre: f.genre,
              releaseDate: f.releaseDate,
              description: f.description,
              posterHue: 40,
              director: "—",
              cast: "—",
              ageRating: "T16",
              status: f.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu",
            },
          ],
        }));
        setMsg("Đã thêm phim tạm vào bộ nhớ local!");
      }
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "Không thể thêm phim"));
    } finally {
      setLoading(false);
    }
  };

  const deleteMovie = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa phim này khỏi CSDL?")) return;
    try {
      await api.deleteMovie(id);
      loadMovies();
    } catch (err: any) {
      alert("Lỗi khi xóa: " + err?.message);
    }
  };

  const moviesList = realMovies.length > 0 ? realMovies : store.movies;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold uppercase tracking-wide">Danh sách phim ({moviesList.length})</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="py-2.5">ID</th>
              <th>Tên phim</th>
              <th>Thời lượng</th>
              <th>Khởi chiếu</th>
              <th>Trạng thái</th>
              {isAdmin && <th className="text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {moviesList.map((m: any) => (
              <tr key={m.movieId} className="hover:bg-secondary/30 transition">
                <td className="py-3 font-mono text-xs text-muted-foreground">{m.movieId}</td>
                <td className="font-semibold text-foreground">{m.title}</td>
                <td>{m.durationMin} phút</td>
                <td>{m.releaseDate ? new Date(m.releaseDate).toLocaleDateString("vi-VN") : "—"}</td>
                <td>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      m.status === "NOW_SHOWING" || m.status === "Đang chiếu"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="text-right">
                    <button
                      onClick={() => deleteMovie(Number(m.movieId))}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition"
                      title="Xóa phim"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="flex h-fit flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold uppercase tracking-wide">Thêm phim mới</h2>
        {msg && <p className="text-xs text-primary font-medium">{msg}</p>}
        <input className={input} placeholder="Tên phim" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className={input} type="number" placeholder="Thời lượng (phút)" required value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: +e.target.value })} />
        <input className={input} type="date" required value={f.releaseDate} onChange={(e) => setF({ ...f, releaseDate: e.target.value })} />
        <input className={input} placeholder="Link Poster ảnh (URL)" value={f.posterUrl} onChange={(e) => setF({ ...f, posterUrl: e.target.value })} />
        <select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="NOW_SHOWING">Đang chiếu (NOW_SHOWING)</option>
          <option value="COMING_SOON">Sắp chiếu (COMING_SOON)</option>
          <option value="ENDED">Ngừng chiếu (ENDED)</option>
        </select>
        <textarea className={input} placeholder="Tóm tắt nội dung phim" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <button disabled={loading} className={btn}>
          {loading ? "Đang lưu..." : "Lưu phim vào hệ thống"}
        </button>
      </form>
    </div>
  );
}

function HallsManagement({ isAdmin }: { isAdmin: boolean }) {
  const store = useStore();
  const [realHalls, setRealHalls] = useState<ApiHall[]>([]);
  const [f, setF] = useState({ hallName: "", hallType: "2D", rows: 8, cols: 10 });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const loadHalls = () => {
    api.getHalls()
      .then((data) => setRealHalls(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadHalls();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.hallName) return;
    setLoading(true);
    setMsg("");

    try {
      if (isAdmin) {
        const created = await api.createHall({ hallName: f.hallName, hallType: f.hallType });
        await api.generateSeats(created.hallId, { rows: f.rows, cols: f.cols });
        setMsg(`Đã tạo phòng ${created.hallName} và sinh ${f.rows * f.cols} ghế thành công!`);
        loadHalls();
        setF({ hallName: "", hallType: "2D", rows: 8, cols: 10 });
      } else {
        store.set((s) => ({
          ...s,
          halls: [...s.halls, { hallId: "h_" + Date.now(), hallName: f.hallName, rows: f.rows, cols: f.cols, totalSeats: f.rows * f.cols }],
        }));
        setMsg("Đã tạo phòng vào bộ nhớ local!");
      }
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "Không thể tạo phòng"));
    } finally {
      setLoading(false);
    }
  };

  const list = realHalls.length > 0 ? realHalls : store.halls;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold uppercase tracking-wide">Danh sách phòng chiếu ({list.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((h: any) => (
            <div key={h.hallId} className="rounded-xl border border-border bg-background/60 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{h.hallName}</span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">{h.hallType || "2D"}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Mã phòng: <b className="font-mono text-foreground">#{h.hallId}</b> · Tổng ghế: <b className="text-foreground">{h.totalSeats || 80}</b>
              </p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={add} className="flex h-fit flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold uppercase tracking-wide">Tạo phòng chiếu mới</h2>
        {msg && <p className="text-xs text-primary font-medium">{msg}</p>}
        <input className={input} placeholder="Tên phòng (VD: Phòng 04 - IMAX Laser)" required value={f.hallName} onChange={(e) => setF({ ...f, hallName: e.target.value })} />
        <select className={input} value={f.hallType} onChange={(e) => setF({ ...f, hallType: e.target.value })}>
          <option value="2D">2D Tiêu chuẩn</option>
          <option value="3D">3D Kỹ thuật số</option>
          <option value="IMAX">IMAX Cinema</option>
          <option value="4DX">4DX Trải nghiệm</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">Số hàng ghế</label>
            <input className={`${input} w-full mt-1`} type="number" min={4} max={14} value={f.rows} onChange={(e) => setF({ ...f, rows: +e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Số cột ghế</label>
            <input className={`${input} w-full mt-1`} type="number" min={6} max={20} value={f.cols} onChange={(e) => setF({ ...f, cols: +e.target.value })} />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Cơ chế tự động: Hàng cuối là ghế Couple, hàng giữa là ghế VIP, còn lại là Standard.
        </p>
        <button disabled={loading} className={btn}>
          {loading ? "Đang tạo..." : "Tạo phòng và sinh ghế"}
        </button>
      </form>
    </div>
  );
}

function ShowtimesManagement({ isAdmin }: { isAdmin: boolean }) {
  const store = useStore();
  const [realShows, setRealShows] = useState<ApiShowtime[]>([]);
  const [realMovies, setRealMovies] = useState<ApiMovie[]>([]);
  const [realHalls, setRealHalls] = useState<ApiHall[]>([]);
  const [f, setF] = useState({ movieId: 0, hallId: 0, startTime: "", ticketPrice: 100000 });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    Promise.all([
      api.getShowtimes().catch(() => []),
      api.getMovies().catch(() => []),
      api.getHalls().catch(() => []),
    ]).then(([shows, movies, halls]) => {
      if (shows) setRealShows(shows);
      if (movies) {
        setRealMovies(movies);
        const firstMovie = movies[0];
        if (firstMovie && f.movieId === 0) setF((prev) => ({ ...prev, movieId: firstMovie.movieId }));
      }
      if (halls) {
        setRealHalls(halls);
        const firstHall = halls[0];
        if (firstHall && f.hallId === 0) setF((prev) => ({ ...prev, hallId: firstHall.hallId }));
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.startTime) return;
    setLoading(true);
    setMsg("");

    try {
      if (isAdmin) {
        await api.createShowtime({
          movieId: Number(f.movieId),
          hallId: Number(f.hallId),
          startTime: new Date(f.startTime).toISOString(),
          ticketPrice: Number(f.ticketPrice),
        });
        setMsg("Đã lập suất chiếu mới thành công vào CSDL!");
        loadData();
      } else {
        store.set((s) => ({
          ...s,
          showtimes: [
            ...s.showtimes,
            {
              showtimeId: "s_" + Date.now(),
              movieId: String(f.movieId),
              hallId: String(f.hallId),
              startTime: new Date(f.startTime).toISOString(),
              ticketPrice: f.ticketPrice,
            },
          ],
        }));
        setMsg("Đã thêm suất chiếu tạm vào bộ nhớ local!");
      }
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "Không thể tạo suất chiếu"));
    } finally {
      setLoading(false);
    }
  };

  const deleteShowtime = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;
    try {
      await api.deleteShowtime(id);
      loadData();
    } catch (err: any) {
      alert("Lỗi khi xóa: " + err?.message);
    }
  };

  const showsList = realShows.length > 0 ? realShows : store.showtimes;      const sortedShows = [...(showsList ?? [])].sort((a: any, b: any) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold uppercase tracking-wide">Danh sách suất chiếu {(showsList?.length) ?? 0}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="py-2.5">Thời gian</th>
              <th>Phim</th>
              <th>Phòng chiếu</th>
              <th>Giá vé gốc</th>
              {isAdmin && <th className="text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedShows.slice(0, 30).map((s: any) => (
              <tr key={s.showtimeId} className="hover:bg-secondary/30 transition">
                <td className="py-3">
                  <span className="block font-medium text-foreground">{fmtTime(s.startTime)}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(s.startTime)}</span>
                </td>
                <td className="font-semibold text-foreground">
                        {(s.movie?.title ?? (store.movies.find((m) => m.movieId === s.movieId)?.title) ?? `Phim #${s.movieId}`)}
                </td>
                <td className="text-muted-foreground">
                        {(s.hall?.hallName ?? (store.halls.find((h) => h.hallId === s.hallId)?.hallName) ?? `Phòng #${s.hallId}`)}
                </td>
                <td className="font-medium text-primary">{vnd(Number(s.ticketPrice))}</td>
                {isAdmin && (
                  <td className="text-right">
                    <button
                      onClick={() => deleteShowtime(Number(s.showtimeId))}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition"
                      title="Xóa suất chiếu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="flex h-fit flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold uppercase tracking-wide">Lập suất chiếu mới</h2>
        {msg && <p className="text-xs text-primary font-medium">{msg}</p>}

        <div>
          <label className="text-[11px] text-muted-foreground">Chọn phim</label>
          <select
            className={`${input} w-full mt-1`}
            value={f.movieId}
            onChange={(e) => setF({ ...f, movieId: +e.target.value })}
          >
            {(realMovies.length > 0 ? realMovies : store.movies).map((m: any) => (
              <option key={m.movieId} value={m.movieId}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground">Chọn phòng chiếu</label>
          <select
            className={`${input} w-full mt-1`}
            value={f.hallId}
            onChange={(e) => setF({ ...f, hallId: +e.target.value })}
          >
            {(realHalls.length > 0 ? realHalls : store.halls).map((h: any) => (
              <option key={h.hallId} value={h.hallId}>
                {h.hallName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground">Thời gian bắt đầu</label>
          <input
            className={`${input} w-full mt-1`}
            type="datetime-local"
            required
            value={f.startTime}
            onChange={(e) => setF({ ...f, startTime: e.target.value })}
          />
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground">Giá vé gốc (VNĐ)</label>
          <input
            className={`${input} w-full mt-1`}
            type="number"
            step={5000}
            required
            value={f.ticketPrice}
            onChange={(e) => setF({ ...f, ticketPrice: +e.target.value })}
          />
        </div>

        <button disabled={loading} className={btn}>
          {loading ? "Đang tạo..." : "Lập suất chiếu"}
        </button>
      </form>
    </div>
  );
}
