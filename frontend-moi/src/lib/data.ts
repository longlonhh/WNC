// Mock data shaped after the ERD (Movies, CinemaHalls, Seats, Showtimes, Users, Bookings, Tickets)
export type MovieStatus = "Đang chiếu" | "Sắp chiếu" | "Ngừng chiếu";
export interface Movie {
  movieId: string; title: string; durationMin: number; description: string;
  posterHue: number; releaseDate: string; genre: string; director: string;
  cast: string; ageRating: string; status: MovieStatus;
}
export interface CinemaHall { hallId: string; hallName: string; rows: number; cols: number; totalSeats: number }
export type SeatType = "Thường" | "VIP" | "Couple";
export interface Seat { seatId: string; hallId: string; seatNumber: string; seatType: SeatType }
export interface Showtime { showtimeId: string; movieId: string; hallId: string; startTime: string; ticketPrice: number }
export interface Booking {
  bookingId: string; userId: string; bookingDate: string; totalAmount: number;
  status: "Đã thanh toán" | "Thất bại"; paymentQrCode: string; method: string;
}
export interface Ticket {
  ticketId: string; bookingId: string; showtimeId: string; seatId: string; price: number; isCheckedIn: boolean;
}

export const SURCHARGE: Record<SeatType, number> = { "Thường": 0, VIP: 20000, Couple: 50000 };

export const movies: Movie[] = [
  { movieId: "m1", title: "Ánh Sáng Cuối Đường", durationMin: 128, description: "Một kỹ sư trẻ phát hiện bí mật về thành phố nơi anh lớn lên, buộc anh phải lựa chọn giữa sự thật và gia đình.", posterHue: 30, releaseDate: "2026-10-03", genre: "Tâm lý", director: "Trần Minh Khoa", cast: "Lê Hoàng, Mai Anh", ageRating: "T13", status: "Đang chiếu" },
  { movieId: "m2", title: "Biên Giới Đỏ", durationMin: 142, description: "Biệt đội đặc nhiệm truy đuổi đường dây buôn lậu xuyên biên giới trong 72 giờ sinh tử.", posterHue: 15, releaseDate: "2026-09-26", genre: "Hành động", director: "Ngô Thanh Vân", cast: "Quốc Trường, Thu Trang", ageRating: "T16", status: "Đang chiếu" },
  { movieId: "m3", title: "Ngôi Nhà Số 9", durationMin: 105, description: "Gia đình mới chuyển đến căn nhà cổ và bắt đầu nghe thấy tiếng gõ cửa lúc nửa đêm.", posterHue: 280, releaseDate: "2026-10-10", genre: "Kinh dị", director: "Lưu Huỳnh", cast: "Kaity Nguyễn, Huỳnh Đông", ageRating: "T18", status: "Đang chiếu" },
  { movieId: "m4", title: "Mùa Hè Của Mèo", durationMin: 96, description: "Chú mèo nhỏ bước vào hành trình phiêu lưu qua những mái nhà Hà Nội để tìm về nhà.", posterHue: 190, releaseDate: "2026-10-01", genre: "Hoạt hình", director: "Phan Gia Nhật Linh", cast: "Lồng tiếng: Hari Won", ageRating: "P", status: "Đang chiếu" },
  { movieId: "m5", title: "Thiên Hà Lặng Im", durationMin: 151, description: "Phi hành đoàn cuối cùng của Trái Đất nhận được tín hiệu từ một hành tinh tưởng đã chết.", posterHue: 240, releaseDate: "2026-11-14", genre: "Khoa học viễn tưởng", director: "Victor Vũ", cast: "Thái Hòa, Ninh Dương Lan Ngọc", ageRating: "T13", status: "Sắp chiếu" },
  { movieId: "m6", title: "Hẹn Em Ngày Mưa", durationMin: 112, description: "Hai người lạ gặp nhau dưới mái hiên Sài Gòn và hẹn ước gặp lại mỗi khi trời đổ mưa.", posterHue: 350, releaseDate: "2026-11-28", genre: "Lãng mạn", director: "Đinh Tuấn Vũ", cast: "Song Luân, Diệu Nhi", ageRating: "T13", status: "Sắp chiếu" },
];

export const halls: CinemaHall[] = [
  { hallId: "h1", hallName: "Phòng 1 — IMAX", rows: 9, cols: 14, totalSeats: 126 },
  { hallId: "h2", hallName: "Phòng 2", rows: 8, cols: 12, totalSeats: 96 },
  { hallId: "h3", hallName: "Phòng 3 — Gold Class", rows: 6, cols: 10, totalSeats: 60 },
];

const ROWS = "ABCDEFGHIJKLMN";
export function seatsOf(hall: CinemaHall): Seat[] {
  const out: Seat[] = [];
  for (let r = 0; r < hall.rows; r++) for (let c = 1; c <= hall.cols; c++) {
    const type: SeatType = r === hall.rows - 1 ? "Couple" : r >= Math.floor(hall.rows / 3) && r < hall.rows - 2 ? "VIP" : "Thường";
    const num = `${ROWS[r]}${c}`;
    out.push({ seatId: `${hall.hallId}-${num}`, hallId: hall.hallId, seatNumber: num, seatType: type });
  }
  return out;
}

function day(offset: number, h: number, m = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d.toISOString();
}
export const initialShowtimes: Showtime[] = (() => {
  const list: Showtime[] = []; let i = 0;
  const now = movies.filter((m) => m.status === "Đang chiếu");
  for (let d = 0; d < 4; d++) now.forEach((m, mi) => {
    [10, 14, 19, 21].forEach((h, hi) => {
      if ((mi + hi + d) % 3 === 2) return;
      list.push({ showtimeId: `s${++i}`, movieId: m.movieId, hallId: halls[(mi + hi) % 3]!.hallId, startTime: day(d, h, (mi * 15) % 60), ticketPrice: h >= 18 ? 95000 : 75000 });
    });
  });
  return list;
})();

// Deterministic "already sold" seats for demo
export function seededSold(showtimeId: string, hall: CinemaHall): string[] {
  let h = 0; for (const ch of showtimeId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return seatsOf(hall).filter((_, idx) => ((idx * 2654435761 + h) >>> 0) % 7 === 0).map((s) => s.seatId);
}

export const vnd = (n: number) => n.toLocaleString("vi-VN") + " ₫";
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
export const posterBg = (hue: number) => `linear-gradient(160deg, oklch(0.45 0.14 ${hue}), oklch(0.18 0.05 ${hue}))`;
