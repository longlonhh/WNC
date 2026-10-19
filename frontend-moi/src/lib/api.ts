/**
 * CineVé API Client — kết nối NestJS Backend (http://localhost:3001)
 */

export const API_BASE = (typeof window !== "undefined" && (window as any).__API_URL__)
  || (import.meta as any).env?.VITE_API_URL
  || "http://localhost:3001";

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface ApiMovie {
  movieId: number;
  title: string;
  description?: string;
  durationMin: number;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  status: "NOW_SHOWING" | "COMING_SOON" | "ENDED";
  createdAt?: string;
}

export interface ApiHall {
  hallId: number;
  hallName: string;
  totalSeats: number;
  hallType: string;
}

export interface ApiShowtime {
  showtimeId: number;
  movieId: number;
  hallId: number;
  startTime: string;
  endTime: string;
  ticketPrice: number | string;
  movie?: ApiMovie;
  hall?: ApiHall;
}

export interface ApiSeatStatus {
  seatId: number;
  seatNumber: string;
  seatType: "STANDARD" | "VIP" | "COUPLE";
  status: "FREE" | "HELD" | "SOLD";
  price: number;
}

export interface ApiBookingResponse {
  bookingId: number;
  status: string;
  totalAmount: number;
  holdExpiresInSeconds: number;
  movie: { movieId: number; title: string; posterUrl?: string };
  showtime: { showtimeId: number; startTime: string; hallName: string };
  seats: Array<{
    seatId: number;
    seatNumber: string;
    seatType: string;
    price: number;
    ticketId?: number;
  }>;
}

export interface ApiPaymentRequestResponse {
  bookingId: number;
  method: string;
  amount: number;
  paymentUrl: string;
  qrDataUrl: string;
  transactionId: string;
  holdExpiresInSeconds: number;
}

export interface ApiPaymentCallbackResponse {
  message: string;
  bookingId: number;
  status: string;
  totalAmount: number;
  tickets: Array<{
    ticketCode: string;
    seatNumber: string;
    price: number;
    qrDataUrl: string;
  }>;
}

export interface ApiTicket {
  ticketId: number;
  bookingId: number;
  showtimeId: number;
  seatId: number;
  price: number;
  ticketCode?: string;
  seat?: { seatNumber: string; seatType: string };
  showtime?: ApiShowtime;
}

export interface ApiBookingHistory {
  bookingId: number;
  userId: number;
  bookingDate: string;
  totalAmount: number;
  status: string;
  paymentQrCode?: string;
  tickets: ApiTicket[];
}

export interface AdminSummary {
  totalRevenue: number;
  ticketsSold: number;
  totalBookings: number;
  totalCustomers: number;
}

export interface RevenueByMovieItem {
  movieId: number;
  title: string;
  posterUrl?: string;
  ticketsSold: number;
  revenue: number;
}

export interface RevenueByHallItem {
  hallId: number;
  hallName: string;
  hallType: string;
  ticketsSold: number;
  revenue: number;
}

export interface RevenueDailyItem {
  day: string;
  revenue: number;
  bookings: number;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cinema_token");
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      throw new Error(`Hết thời gian kết nối (${timeoutMs / 1000}s). Vui lòng kiểm tra backend đang chạy tại ${API_BASE}.`);
    }
    throw new Error(`Không kết nối được backend: ${err?.message || "Network error"}`);
  }
  clearTimeout(timer);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || `Lỗi yêu cầu (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (dto: { email: string; password: string }) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(dto) }),
  register: (dto: { fullName: string; email: string; password: string; phone?: string }) =>
    apiFetch<LoginResponse>("/auth/register", { method: "POST", body: JSON.stringify(dto) }),
  getMe: () => apiFetch<AuthUser>("/auth/me"),

  // Movies
  getMovies: (status?: string) =>
    apiFetch<ApiMovie[]>(`/movies${status ? `?status=${status}` : ""}`),
  getMovie: (id: number) => apiFetch<ApiMovie>(`/movies/${id}`),
  createMovie: (dto: any) =>
    apiFetch<ApiMovie>("/movies", { method: "POST", body: JSON.stringify(dto) }),
  deleteMovie: (id: number) =>
    apiFetch<any>(`/movies/${id}`, { method: "DELETE" }),

  // Halls
  getHalls: () => apiFetch<ApiHall[]>("/halls"),
  getHall: (id: number) => apiFetch<ApiHall>(`/halls/${id}`),
  createHall: (dto: { hallName: string; hallType: string }) =>
    apiFetch<ApiHall>("/halls", { method: "POST", body: JSON.stringify(dto) }),
  generateSeats: (hallId: number, dto: { rows: number; cols: number; vipRows?: number[]; coupleRows?: number[] }) =>
    apiFetch<any>(`/halls/${hallId}/seats/generate`, { method: "POST", body: JSON.stringify(dto) }),

  // Showtimes
  getShowtimes: (movieId?: number, date?: string) => {
    const params = new URLSearchParams();
    if (movieId) params.append("movieId", String(movieId));
    if (date) params.append("date", date);
    const qs = params.toString();
    return apiFetch<ApiShowtime[]>(`/showtimes${qs ? `?${qs}` : ""}`);
  },
  getShowtime: (id: number) => apiFetch<ApiShowtime>(`/showtimes/${id}`),
  createShowtime: (dto: { movieId: number; hallId: number; startTime: string; ticketPrice: number }) =>
    apiFetch<ApiShowtime>("/showtimes", { method: "POST", body: JSON.stringify(dto) }),
  deleteShowtime: (id: number) => apiFetch<any>(`/showtimes/${id}`, { method: "DELETE" }),

  // Seats Real-time
  getSeatsStatus: (showtimeId: number) =>
    apiFetch<ApiSeatStatus[]>(`/showtimes/${showtimeId}/seats-status`),

  // Bookings
  createBooking: (dto: { showtimeId: number; seats: Array<{ seatId: number }> }) =>
    apiFetch<ApiBookingResponse>("/bookings", { method: "POST", body: JSON.stringify(dto) }),
  createPaymentRequest: (bookingId: number, method: "MOMO" | "VNPAY") =>
    apiFetch<ApiPaymentRequestResponse>(`/bookings/${bookingId}/payment-request`, {
      method: "POST",
      body: JSON.stringify({ method }),
    }),
  paymentCallback: (bookingId: number, success: boolean, transactionId?: string) =>
    apiFetch<ApiPaymentCallbackResponse>(`/bookings/${bookingId}/payment-callback`, {
      method: "POST",
      body: JSON.stringify({ success, transactionId }),
    }),
  getMyBookings: () => apiFetch<ApiBookingHistory[]>("/bookings/my"),
  getBookingDetail: (id: number) => apiFetch<ApiBookingHistory>(`/bookings/${id}`),

  // Staff
  checkinTicket: (ticketCode: string) =>
    apiFetch<{ message: string; ticket: any; checkedBy: number; checkedAt: string }>("/staff/checkin", {
      method: "POST",
      body: JSON.stringify({ ticketCode }),
    }),

  // Admin stats
  getAdminSummary: () => apiFetch<AdminSummary>("/admin/stats/summary"),
  getRevenueByMovie: () => apiFetch<RevenueByMovieItem[]>("/admin/stats/revenue-by-movie"),
  getRevenueByHall: () => apiFetch<RevenueByHallItem[]>("/admin/stats/revenue-by-hall"),
  getRevenueDaily: () => apiFetch<RevenueDailyItem[]>("/admin/stats/revenue-daily"),
};
