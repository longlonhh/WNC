import { posterBg, type Movie } from "@/lib/data";
import { useState } from "react";

export function Poster({ movie, className = "" }: { movie: any; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const hasValidImg = Boolean(movie.posterUrl && !imgError && !movie.posterUrl.includes("example.com"));

  return (
    <div
      className={`relative flex aspect-[2/3] flex-col justify-end overflow-hidden rounded-lg p-4 shadow-md ${className}`}
      style={{ background: posterBg(movie.posterHue ?? 30) }}
    >
      {hasValidImg && (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <span className="absolute right-2 top-2 z-10 rounded bg-background/80 px-2 py-0.5 text-xs font-semibold text-primary backdrop-blur">
        {movie.ageRating || "P"}
      </span>
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-widest text-primary font-medium">{movie.genre || "Điện ảnh"}</p>
        <h3 className="text-xl font-bold uppercase leading-tight text-foreground drop-shadow">{movie.title}</h3>
      </div>
    </div>
  );
}
