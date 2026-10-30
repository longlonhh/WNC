/** Định dạng tiền tệ / ngày giờ theo locale Việt Nam */

export const vnd = (n: number | string) => `${Number(n || 0).toLocaleString("vi-VN")} ₫`;

/** Khóa ngày local (YYYY-MM-DD) — dùng để gom suất chiếu theo ngày */
export function toDateKey(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "Hôm nay" / "Ngày mai" / "25/10" */
export function dateLabel(key: string): string {
  const today = toDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === today) return "Hôm nay";
  if (key === toDateKey(tomorrow)) return "Ngày mai";
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

/** 15:30 */
export function timeLabel(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 15:30, 25/10/2026 */
export function dateTimeLabel(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${timeLabel(d)}, ${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Poster dự phòng khi URL hỏng / không tải được */
export const POSTER_FALLBACK =
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#003580"/><rect x="20" y="20" width="360" height="560" fill="none" stroke="#febb02" stroke-width="6"/><text x="200" y="300" fill="#febb02" font-size="34" font-family="sans-serif" text-anchor="middle">CineBook</text></svg>`,
  )}`;

export const onPosterError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset["fallback"] === "1") return;
  img.dataset["fallback"] = "1";
  img.src = POSTER_FALLBACK;
};
