/**
 * API client — cầu nối giữa giao diện (react-bootstrap) và NestJS backend.
 *
 * Mặc định trỏ tới http://localhost:3001, đổi bằng biến môi trường VITE_API_URL.
 * Toàn bộ lời gọi API diễn ra phía trình duyệt (client-side) sau khi trang đã render.
 */

const API_URL = String(import.meta.env["VITE_API_URL"] ?? "http://localhost:3001").replace(
  /\/+$/,
  "",
);

const TOKEN_KEY = "cineve_token";
const USER_KEY = "cineve_user";

/* ============================ TOKEN / PHIÊN ============================ */

const hasWindow = () => typeof window !== "undefined";

export function getToken(): string | null {
  return hasWindow() ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function getSession(): SessionUser | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser) {
  if (!hasWindow()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/* ============================== KIỂU DỮ LIỆU ============================== */

export type Role = "ADMIN" | "STAFF" | "CUSTOMER";
export type MovieStatus = "NOW_SHOWING" | "COMING_SOON" | "ENDED";
export type SeatType = "STANDARD" | "VIP" | "COUPLE";
export type SeatState = "FREE" | "HELD" | "SOLD";
export type PaymentMethod = "MOMO" | "VNPAY";

export interface SessionUser {
  userId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
}

export interface Movie {
  movieId: number;
  title: string;
  description?: string | null;
  durationMin: number;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  releaseDate: string;
  status: MovieStatus;
}

export interface Hall {
  hallId: number;
  hallName: string;
  totalSeats: number;
  hallType: "2D" | "3D" | "IMAX";
}

export interface Showtime {
  showtimeId: number;
  movieId: number;
  hallId: number;
  startTime: string;
  endTime: string;
  ticketPrice: number | string;
  movie?: Movie;
  hall?: Hall;
}

export interface SeatInfo {
  seatId: number;
  seatNumber: string;
  seatType: SeatType;
  status: SeatState;
  price: number | string;
}

export interface BookedSeat {
  seatId: number;
  seatNumber: string;
  seatType: SeatType;
  price: number | string;
  ticketId?: number;
}

export interface BookingDraft {
  bookingId: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  totalAmount: number | string;
  holdExpiresInSeconds: number;
  movie: { movieId: number; title: string; posterUrl?: string | null };
  showtime: { showtimeId: number; startTime: string; hallName: string };
  seats: BookedSeat[];
}

export interface PaymentRequest {
  bookingId: number;
  method: PaymentMethod;
  amount: number | string;
  paymentUrl: string;
  qrDataUrl: string;
  transactionId: string;
  holdExpiresInSeconds: number;
}

export interface PaidTicket {
  ticketCode: string;
  seatNumber: string;
  price: number | string;
  qrDataUrl: string;
}

export interface PaymentResult {
  message: string;
  bookingId: number;
  status: string;
  totalAmount: number | string;
  tickets: PaidTicket[];
}

export interface CheckinResult {
  message: string;
  ticket: {
    ticketCode: string;
    seatNumber: string;
    seatType: SeatType;
    movieTitle: string;
    startTime: string;
    hallName: string;
  };
  checkedAt: string;
}

export interface AdminSummary {
  totalRevenue: number;
  ticketsSold: number;
  totalBookings: number;
  totalCustomers: number;
}

export interface RevenueByMovie {
  movieId: number;
  title: string;
  posterUrl?: string | null;
  ticketsSold: number;
  revenue: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/* ============================== GỌI API ============================== */

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bỏ Authorization header (endpoint @Public) */
  anonymous?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, anonymous } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token && !anonymous) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, "Không kết nối được tới máy chủ. Hãy kiểm tra backend đã chạy chưa.");
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      (data as { message?: string | string[] } | null)?.message !== undefined
        ? String((data as { message: string | string[] }).message)
        : `Lỗi ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

/** Bóc thông báo lỗi NestJS (message có thể là mảng validation) */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

/* ------------------------------- AUTH ------------------------------- */

export async function login(email: string, password: string) {
  const res = await request<{ access_token: string; user: SessionUser }>("/auth/login", {
    method: "POST",
    body: { email, password },
    anonymous: true,
  });
  setSession(res.access_token, res.user);
  return res.user;
}

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const res = await request<{ access_token: string; user: SessionUser }>("/auth/register", {
    method: "POST",
    body: input,
    anonymous: true,
  });
  setSession(res.access_token, res.user);
  return res.user;
}

/* ------------------------------- DỮ LIỆU ------------------------------- */

export function fetchMovies(status?: MovieStatus) {
  const qs = status ? `?status=${status}` : "";
  return request<Movie[]>(`/movies${qs}`, { anonymous: true });
}

export function fetchShowtimes(params: { movieId?: number; date?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.movieId) qs.set("movieId", String(params.movieId));
  if (params.date) qs.set("date", params.date);
  const query = qs.toString();
  return request<Showtime[]>(`/showtimes${query ? `?${query}` : ""}`, { anonymous: true });
}

export function fetchSeatStatus(showtimeId: number) {
  return request<SeatInfo[]>(`/showtimes/${showtimeId}/seats-status`, { anonymous: true });
}

/* ----------------------------- ĐẶT VÉ ----------------------------- */

/** Giữ ghế 8 phút + tính tiền theo loại ghế (Thường x1, VIP x1.5, Couple x2) */
export function createBooking(showtimeId: number, seatIds: number[]) {
  return request<BookingDraft>("/bookings", {
    method: "POST",
    body: { showtimeId, seats: seatIds.map((seatId) => ({ seatId })) },
  });
}

/** Tạo yêu cầu thanh toán MoMo / VNPay (cổng giả lập) */
export function createPaymentRequest(bookingId: number, method: PaymentMethod) {
  return request<PaymentRequest>(`/bookings/${bookingId}/payment-request`, {
    method: "POST",
    body: { method },
  });
}

/** Callback của cổng thanh toán: thành công -> cấp mã vé QR, thất bại -> mở khóa ghế */
export function confirmPayment(bookingId: number, success: boolean, transactionId?: string) {
  return request<PaymentResult>(`/bookings/${bookingId}/payment-callback`, {
    method: "POST",
    body: { success, transactionId },
  });
}

/* ------------------------- STAFF / ADMIN ------------------------- */

export function checkinTicket(ticketCode: string) {
  return request<CheckinResult>("/staff/checkin", {
    method: "POST",
    body: { ticketCode },
  });
}

export function fetchAdminSummary(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return request<AdminSummary>(`/admin/stats/summary${query ? `?${query}` : ""}`);
}

export function fetchRevenueByMovie(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return request<RevenueByMovie[]>(`/admin/stats/revenue-by-movie${query ? `?${query}` : ""}`);
}


/* ------------------------- ADMIN: PHIM & LỊCH CHIẾU ------------------------- */

export interface CreateMovieInput {
  title: string;
  description?: string;
  durationMin: number;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  status?: MovieStatus;
}

export interface CreateShowtimeInput {
  movieId: number;
  hallId: number;
  startTime: string; // ISO
  ticketPrice: number;
}

export function createMovie(data: CreateMovieInput) {
  return request<Movie>("/movies", { method: "POST", body: data });
}

export function updateMovie(movieId: number, data: Partial<CreateMovieInput>) {
  return request<Movie>(`/movies/${movieId}`, { method: "PATCH", body: data });
}

export function deleteMovie(movieId: number) {
  return request(`/movies/${movieId}`, { method: "DELETE" });
}

export function createShowtime(data: CreateShowtimeInput) {
  return request<Showtime>("/showtimes", { method: "POST", body: data });
}

export function updateShowtime(showtimeId: number, data: Partial<CreateShowtimeInput>) {
  return request<Showtime>(`/showtimes/${showtimeId}`, { method: "PATCH", body: data });
}

export function deleteShowtime(showtimeId: number) {
  return request(`/showtimes/${showtimeId}`, { method: "DELETE" });
}

export function fetchHalls() {
  return request<Hall[]>("/halls", { anonymous: true });
}
