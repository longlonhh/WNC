import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Play, ArrowLeft, Calendar } from "lucide-react";
import { Poster } from "@/components/Poster";
import { fmtDate, fmtTime, posterBg, vnd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { api, type ApiShowtime } from "@/lib/api";

export const Route = createFileRoute("/phim/$movieId")({
  head: () => ({
    meta: [
      { title: "Chi tiết phim & lịch chiếu — CineVé" },
      { name: "description", content: "Thông tin phim, trailer và chọn suất chiếu phù hợp." },
      { property: "og:title", content: "Chi tiết phim — CineVé" },
      { property: "og:description", content: "Xem thông tin phim và đặt vé." },
    ],
  }),
  component: MovieDetail,
});

function MovieDetail() {
  const { movieId } = Route.useParams();
  const store = useStore();
  const [movie, setMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const numId = Number(movieId);

    // Try backend first
    if (!isNaN(numId)) {
      Promise.all([
        api.getMovie(numId).catch(() => null),
        api.getShowtimes(numId).catch(() => []),
      ]).then(([m, st]) => {
        if (!mounted) return;
        if (m) {
          setMovie({
            movieId: String(m.movieId),
            title: m.title,
            durationMin: m.durationMin,
            description: m.description || "",
            posterUrl: m.posterUrl,
            posterHue: 35,
            releaseDate: m.releaseDate,
            genre: (m as any).genre || "Hành động, Tâm lý",
            director: (m as any).director || "Đạo diễn chuyên nghiệp",
            cast: (m as any).cast || "Dàn diễn viên nổi tiếng",
            ageRating: (m as any).ageRating || "T16",
            status: m.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu",
          });
        }
        if (st && st.length > 0) {
          setShowtimes(
            st.map((s: ApiShowtime) => ({
              showtimeId: String(s.showtimeId),
              movieId: String(s.movieId),
              hallId: String(s.hallId),
              hallName: s.hall?.hallName || `Phòng ${s.hallId}`,
              startTime: s.startTime,
              ticketPrice: Number(s.ticketPrice),
            }))
          );
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => { mounted = false; };
  }, [movieId]);

  // Fallback to local store if backend had no matching item
  const currentMovie = movie || store.movies.find((m) => m.movieId === movieId);
  const currentShows: any[] = showtimes.length > 0
    ? showtimes
    : store.showtimes
        .filter((s) => s.movieId === movieId)
        .map((s) => {
          const hall = store.halls.find((h) => h.hallId === s.hallId);
          return { ...s, hallName: hall?.hallName || "Phòng chiếu" };
        });

  const sortedShows = [...currentShows].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const days = [...new Set(sortedShows.map((s) => s.startTime.slice(0, 10)))];
  const activeDay = day ?? days[0];

  if (loading) {
    return <div className="p-20 text-center text-muted-foreground">Đang tải thông tin phim...</div>;
  }

  if (!currentMovie) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-xl font-semibold">Không tìm thấy phim yêu cầu.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  // Group shows by hall for the active day
  const showsForDay = sortedShows.filter((s) => s.startTime.slice(0, 10) === activeDay);
  const hallsForDay = [...new Set(showsForDay.map((s) => s.hallName))];

  return (
    <div>
      <div className="relative" style={{ background: posterBg(currentMovie.posterHue ?? 35) }}>
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[240px_1fr]">
          <Poster movie={currentMovie} />
          <div className="self-end">
            <span className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {currentMovie.status}
            </span>
            <h1 className="mt-3 text-4xl font-bold uppercase md:text-5xl">{currentMovie.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {currentMovie.durationMin} phút
              </span>
              <span>{currentMovie.genre}</span>
              <span>Khởi chiếu {new Date(currentMovie.releaseDate).toLocaleDateString("vi-VN")}</span>
              <span className="rounded border border-primary/40 px-1 text-xs text-primary">{currentMovie.ageRating}</span>
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-foreground/90">{currentMovie.description}</p>
            <dl className="mt-4 grid max-w-xl grid-cols-[100px_1fr] gap-1 text-sm">
              <dt className="text-muted-foreground">Đạo diễn</dt>
              <dd>{currentMovie.director}</dd>
              <dt className="text-muted-foreground">Diễn viên</dt>
              <dd>{currentMovie.cast}</dd>
            </dl>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-3xl uppercase tracking-wide">Lịch chiếu</h2>
          <span className="text-xs text-muted-foreground">Hỗ trợ chọn ghế trực quan thời gian thực</span>
        </div>

        {sortedShows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
            <p>Hiện chưa có suất chiếu cho phim này.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`min-w-28 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    activeDay === d
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {fmtDate(d + "T12:00:00")}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {hallsForDay.map((hName) => {
                const hs = showsForDay.filter((s) => s.hallName === hName);
                if (!hs.length) return null;
                return (
                  <div key={hName} className="rounded-xl border border-border bg-card p-5">
                    <p className="mb-3 font-semibold text-foreground">{hName}</p>
                    <div className="flex flex-wrap gap-3">
                      {hs.map((s) => (
                        <Link
                          key={s.showtimeId}
                          to="/dat-ve/$showtimeId"
                          params={{ showtimeId: s.showtimeId }}
                          className="group rounded-lg border border-border bg-secondary/30 px-5 py-2.5 text-center transition hover:border-primary hover:bg-primary/10"
                        >
                          <span className="block font-display text-xl font-bold text-foreground group-hover:text-primary">
                            {fmtTime(s.startTime)}
                          </span>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground">
                            {vnd(s.ticketPrice)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
