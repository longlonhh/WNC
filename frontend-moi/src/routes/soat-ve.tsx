import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ScanLine, XCircle, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { fmtDate, fmtTime } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export const Route = createFileRoute("/soat-ve" as const)({
  head: () => ({
    meta: [
      { title: "Soát vé tại rạp — CineVé" },
      { name: "description", content: "Nhân viên quét hoặc nhập mã vé để xác thực và check-in." },
      { property: "og:title", content: "Soát vé — CineVé" },
      { property: "og:description", content: "Công cụ soát vé cho nhân viên rạp." },
    ],
  }),
  component: Scanner,
});

type Result = { ok: boolean; title: string; detail?: string };

function Scanner() {
  const { user, quickLogin } = useAuth();
  const store = useStore();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentCodes, setRecentCodes] = useState<string[]>([]);

  // Collect testable codes from backend recent bookings if available
  useEffect(() => {
    api.getMyBookings()
      .then((data) => {
        if (Array.isArray(data)) {
          const codes: string[] = [];
          data.forEach((b) => {
            b.tickets?.forEach((t) => {
              if (t.ticketCode && !t.ticketCode.endsWith("-USED")) {
                codes.push(t.ticketCode);
              }
            });
          });
          setRecentCodes(codes.slice(0, 5));
        }
      })
      .catch(() => {});
  }, [user]);

  const isAuthorized = user && (user.role === "STAFF" || user.role === "ADMIN");

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setResult(null);

    // Try backend check-in first if logged in as staff/admin
    if (isAuthorized) {
      try {
        const res = await api.checkinTicket(clean);
        const t = res.ticket;
        const detail = t
          ? `${t.movieTitle} · ${t.hallName} · ${t.startTime ? fmtTime(t.startTime) : ""} · Ghế ${t.seatNumber} (${t.seatType})`
          : "Đã xác thực và chuyển trạng thái vé sang ĐÃ SOÁT.";

        setResult({
          ok: true,
          title: "Hợp lệ — Đã check-in thành công!",
          detail,
        });
        setCode("");
        setLoading(false);
        return;
      } catch (err: any) {
        setResult({
          ok: false,
          title: "Xác thực thất bại",
          detail: err?.message || "Mã vé không hợp lệ hoặc đã qua sử dụng.",
        });
        setLoading(false);
        return;
      }
    }

    // Local fallback check-in
    const t = store.tickets.find((x) => x.ticketId === clean);
    if (!t) {
      setResult({ ok: false, title: "Vé không tồn tại", detail: "Mã vé không tìm thấy trong hệ thống." });
      setLoading(false);
      return;
    }
    const s = store.showtimes.find((x) => x.showtimeId === t.showtimeId);
    const m = store.movies.find((x) => x.movieId === s?.movieId);
    const h = store.halls.find((x) => x.hallId === s?.hallId);
    const info = `${m?.title || "Phim"} · ${h?.hallName || "Phòng"} · ${s ? fmtTime(s.startTime) + " " + fmtDate(s.startTime) : ""} · Ghế ${t.seatId.split("-")[1] || t.seatId}`;

    if (t.isCheckedIn) {
      setResult({ ok: false, title: "Vé đã được sử dụng trước đó", detail: info });
      setLoading(false);
      return;
    }

    store.set((st) => ({
      ...st,
      tickets: st.tickets.map((x) => (x.ticketId === t.ticketId ? { ...x, isCheckedIn: true } : x)),
    }));
    setResult({ ok: true, title: "Hợp lệ — Đã check-in thành công", detail: info });
    setCode("");
    setLoading(false);
  };

  const localPending = store.tickets.filter((t) => !t.isCheckedIn).slice(-5).map((t) => t.ticketId);
  const sampleCodes = recentCodes.length > 0 ? recentCodes : localPending;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-wide">Soát vé tại rạp</h1>
          <p className="text-xs text-muted-foreground">Quét mã QR hoặc nhập mã vé điện tử của khách hàng</p>
        </div>
        {user && (
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            {user.role === "STAFF" ? "Nhân viên soát vé" : user.role === "ADMIN" ? "Quản trị viên" : user.fullName}
          </span>
        )}
      </div>

      {!isAuthorized && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>Cần quyền nhân viên (STAFF hoặc ADMIN) để ghi nhận check-in vào CSDL</span>
          </div>
          <p className="text-muted-foreground">
            Bạn có thể đăng nhập nhanh bằng tài khoản Nhân viên soát vé mẫu bên dưới:
          </p>
          <button
            onClick={() => quickLogin("STAFF")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 font-bold uppercase tracking-wider text-black shadow hover:bg-amber-400 transition"
          >
            <UserCheck className="h-3.5 w-3.5" /> Đăng nhập Staff (staff@cinema.vn)
          </button>
        </div>
      )}

      <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/50 bg-card/60 shadow-inner">
        <ScanLine className="h-20 w-20 animate-pulse text-primary" />
        <span className="absolute bottom-4 text-xs font-medium text-muted-foreground">
          Đưa mã QR trên vé điện tử vào khung camera
        </span>
      </div>

      <form onSubmit={verify} className="mt-5 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã vé (VD: CPX-0001-001-..., VEABC...)"
          className="flex-1 rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={loading || !code.trim()}
          className="rounded-xl bg-primary px-6 font-bold uppercase tracking-wider text-primary-foreground shadow hover:opacity-90 disabled:opacity-40 transition"
        >
          {loading ? "Đang ktra..." : "Xác thực"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-6 flex gap-3.5 rounded-2xl border p-5 shadow-sm ${
            result.ok
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
              : "border-destructive/60 bg-destructive/10 text-destructive"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-7 w-7 text-destructive shrink-0" />
          )}
          <div>
            <p className="font-bold text-base">{result.title}</p>
            {result.detail && <p className="mt-1 text-xs opacity-90 leading-relaxed">{result.detail}</p>}
          </div>
        </div>
      )}

      {sampleCodes.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-4 text-xs">
          <p className="mb-2 font-semibold text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Mã vé chưa soát gần đây (bấm để thử ngay):
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleCodes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCode(c)}
                className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 font-mono text-xs hover:border-primary hover:text-primary transition"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
