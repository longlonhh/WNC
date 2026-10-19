import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import { Poster } from "@/components/Poster";
import { useStore } from "@/lib/store";
import { api, type ApiMovie } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineVé — Phim đang chiếu & sắp chiếu" },
      { name: "description", content: "Xem lịch chiếu, chọn ghế theo sơ đồ thời gian thực và đặt vé xem phim trực tuyến." },
      { property: "og:title", content: "CineVé — Phim đang chiếu & sắp chiếu" },
      { property: "og:description", content: "Đặt vé xem phim trực tuyến, nhận vé QR qua email." },
    ],
  }),
  component: Index,
});

function normalizeStatus(st: string): "Đang chiếu" | "Sắp chiếu" {
  if (st === "NOW_SHOWING" || st === "Đang chiếu") return "Đang chiếu";
  return "Sắp chiếu";
}

function Index() {
  const store = useStore();
  const [tab, setTab] = useState<"Đang chiếu" | "Sắp chiếu">("Đang chiếu");
  const [genre, setGenre] = useState("Tất cả");
  const [apiMovies, setApiMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getMovies()
      .then((data) => {
        if (!mounted) return;
        if (data && data.length > 0) {
          const mapped = data.map((m, idx) => ({
            movieId: String(m.movieId),
            title: m.title,
            durationMin: m.durationMin,
            description: m.description || "",
            posterUrl: m.posterUrl,
            posterHue: (idx * 65 + 20) % 360,
            releaseDate: m.releaseDate,
            genre: (m as any).genre || (idx % 2 === 0 ? "Hành động" : "Tâm lý"),
            director: (m as any).director || "Đạo diễn",
            cast: (m as any).cast || "Diễn viên",
            ageRating: (m as any).ageRating || "T16",
            status: normalizeStatus(m.status),
          }));
          setApiMovies(mapped);
        }
      })
      .catch((e) => {
        console.warn("Could not fetch movies from backend, using local store", e);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const movies = apiMovies.length > 0 ? apiMovies : store.movies;
  const genres = ["Tất cả", ...new Set(movies.map((m) => m.genre).filter(Boolean))];
  const list = movies.filter((m) => m.status === tab && (genre === "Tất cả" || m.genre === genre));

  return (
    <div>
      <section className="relative h-[460px] overflow-hidden">
        <img src={hero} alt="Rạp chiếu phim" width={1600} height={800} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-primary">Đêm nay xem gì?</p>
          <h1 className="max-w-2xl text-5xl font-bold uppercase leading-none md:text-7xl">Chọn ghế. Thanh toán. Vào rạp.</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">Giữ ghế 8 phút trong khi bạn thanh toán, nhận vé QR ngay trên web và qua email.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-6">
            {(["Đang chiếu", "Sắp chiếu"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-display text-2xl uppercase transition-colors ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`rounded-full border px-3 py-1 text-xs transition ${genre === g ? "border-primary bg-primary text-primary-foreground font-semibold" : "border-border text-muted-foreground hover:border-border/80"}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Đang tải danh sách phim...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((m) => (
              <Link key={m.movieId} to="/phim/$movieId" params={{ movieId: m.movieId }} className="group">
                <Poster movie={m} className="transition-transform group-hover:-translate-y-1 group-hover:shadow-glow" />
                <p className="mt-2 text-sm text-muted-foreground font-medium">{m.durationMin} phút · {m.genre}</p>
              </Link>
            ))}
            {list.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Không có phim phù hợp trong danh mục này.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
