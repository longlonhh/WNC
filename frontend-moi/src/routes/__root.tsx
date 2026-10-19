import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Film, LogOut, LogIn } from "lucide-react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/LoginModal";
import { API_BASE } from "@/lib/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Không tìm thấy trang</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Trang không tải được</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Thử lại</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CineVé — Đặt vé xem phim trực tuyến" },
      { name: "description", content: "Hệ thống bán vé xem phim trực tuyến: chọn ghế thời gian thực, thanh toán và nhận vé QR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const publicNav = [
  { to: "/", label: "Phim" },
  { to: "/lich-su", label: "Vé của tôi" },
] as const;

const staffNav = [
  { to: "/soat-ve", label: "Soát vé" },
] as const;

const adminNav = [
  { to: "/admin", label: "Quản trị" },
] as const;

function HeaderNav() {
  const { user, logout, setShowLoginModal } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/movies`)
      .then((r) => setApiOnline(r.ok))
      .catch(() => setApiOnline(false));
  }, []);

  const allNav = [
    ...publicNav,
    ...(user && (user.role === "STAFF" || user.role === "ADMIN") ? staffNav : []),
    ...(user && user.role === "ADMIN" ? adminNav : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-wide text-primary">
            <Film className="h-6 w-6" /> CineVé
          </Link>
          <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11px] sm:flex">
            <span className={`h-2 w-2 rounded-full ${apiOnline === true ? "bg-emerald-500 animate-pulse" : apiOnline === false ? "bg-rose-500" : "bg-amber-500"}`} />
            <span className="text-muted-foreground">API {apiOnline ? "Sẵn sàng" : "Chưa kết nối"}</span>
          </div>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          {allNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 bg-secondary text-foreground" }}
            >
              {n.label}
            </Link>
          ))}

          {/* User section */}
          <div className="ml-2 pl-2 border-l border-border">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden text-right text-xs md:block">
                  <p className="font-semibold text-foreground">{user.fullName}</p>
                  <p className="text-[10px] uppercase tracking-wider text-primary">
                    {user.role === "ADMIN" ? "👑 Quản trị" : user.role === "STAFF" ? "🎫 Soát vé" : "🍿 Khách hàng"}
                  </p>
                </div>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Thoát</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <AuthProvider>
        <StoreProvider>
          <HeaderNav />
          <main className="min-h-[calc(100vh-8rem)]">
            <Outlet />
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
            © 2026 CineVé — Hệ thống bán vé xem phim trực tuyến (NestJS API + MySQL + TanStack Router)
          </footer>
          <LoginModal />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
