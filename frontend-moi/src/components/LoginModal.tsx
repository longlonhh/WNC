import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, User, Lock, Mail, Phone, ShieldCheck, Ticket, Users } from "lucide-react";

export function LoginModal() {
  const { showLoginModal, setShowLoginModal, login, register, quickLogin } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(fullName, email, password, phone);
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: "ADMIN" | "STAFF" | "CUSTOMER") => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setError(err?.message || "Đăng nhập nhanh thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
            {mode === "login" ? "Đăng nhập CineVé" : "Tạo tài khoản mới"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login"
              ? "Đăng nhập để đặt vé, theo dõi lịch sử và nhận mã QR"
              : "Đăng ký thành viên để nhận ưu đãi xem phim"}
          </p>
        </div>

        {/* Quick Demo Logins */}
        <div className="mb-6 rounded-xl border border-border/80 bg-background/50 p-3">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Đăng nhập nhanh bằng tài khoản Demo
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick("ADMIN")}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card/60 p-2 text-xs font-medium hover:border-primary hover:bg-primary/10 transition"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Quản trị viên</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick("STAFF")}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card/60 p-2 text-xs font-medium hover:border-primary hover:bg-primary/10 transition"
            >
              <Ticket className="h-4 w-4 text-primary" />
              <span>Soát vé</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuick("CUSTOMER")}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card/60 p-2 text-xs font-medium hover:border-primary hover:bg-primary/10 transition"
            >
              <Users className="h-4 w-4 text-primary" />
              <span>Khách hàng</span>
            </button>
          </div>
        </div>

        <div className="relative mb-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">Hoặc nhập email</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <p>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); }}
                className="font-semibold text-primary hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className="font-semibold text-primary hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
