# WNC
# 🎬 CineVé — Hệ thống Bán vé xem phim trực tuyến

## Cấu trúc

- `frontend/` — Next.js 14 + Tailwind CSS 3 (frontend cũ, chỉ để tham chiếu)
- `frontend-moi/` — TanStack Start 1 (React 19 + TanStack Router + TanStack Query + Tailwind CSS 4) — **frontend mặc định**
- `backend/` — NestJS 10 + TypeORM + MySQL 8 (API chính)
- `csdl.drawio.png`, `kientruchethong.drawio.png`, `datvathanhtoan.drawio.png` — tài liệu thiết kế

## Môi trường backend

Tạo file `backend/.env` nếu cần

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=04112005
DB_NAME=cinema_booking_db
JWT_SECRET=cinema-secret-key-2026
PORT=3001
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@cineve.vn
```

## Cách chạy

### Backend API

```bash
cd backend
npm install
npm run seed   # tạo user + cinema halls + seats + showtimes + demo bookings (nếu DB trống)
npm run build
npm run start:dev
```

Backend lắng nghe `http://localhost:3001`.

### Frontend UI (mặc định là frontend-moi)

Hiện tại dự án dùng Node 18 + npm. Không có bun, nên dùng npm với vite 5.

```bash
cd frontend-moi
npm install
npm run dev      # dev server trên port mặc định
```

Hoặc nếu muốn chạy bản build được đóng gói sẵn:

```bash
cd frontend-moi
npm run build
npm run preview  # serve bản build trên port mặc định
```

Để front-end gọi ở API backend, đặt biến môi trường trong file `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Tới lúc nào có bun thì có thể quay lại dùng `bun install` / `bun run dev` như cũ.

## Tài khoản demo

Mật khẩu chung: `123456`

| Vai trò | Email |
|---|---|
| ADMIN | admin@cinema.vn |
| STAFF (soát vé) | staff@cinema.vn |
| CUSTOMER | khach@cinema.vn |

## Luồng đặt vé

1. Client chọn suất và ghế rồi gọi `POST /bookings` (BookingModule)
2. TicketService giữ ghé 8 phút + tính tiền theo loại (Thường x1, VIP x1.5, Couple x2)
3. Client gọi `POST /bookings/:id/payment-request` — cổng thanh toán giả lập trả QR
4. Callback `POST /bookings/:id/payment-callback` — thành công thì mã hóa vé QR và gửi email (nếu đã cấu hình SMTP), nếu thất bại thì mở khóa lại
5. Staff check-in qua `POST /staff/checkin` — trạng thái vé chuyển sang đã soát

## API chính

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | công khai |
| GET | `/movies`, `/movies/:id` | công khai |
| GET | `/showtimes?movieId=&date=` | công khai |
| GET | `/showtimes/:id/seats-status` | công khai, dùng cho sơ đồ ghế realtime |
| POST | `/bookings` | cần đăng nhập |
| POST | `/bookings/:id/payment-request` | cần đăng nhập |
| POST | `/bookings/:id/payment-callback` | cần đăng nhập |
| GET | `/bookings/my` | cần đăng nhập |
| GET | `/bookings/:id` | chủ đơn hoặc STAFF/ADMIN |
| POST | `/staff/checkin` | STAFF hoặc ADMIN |
| GET | `/admin/stats/*` | ADMIN |
| CRUD | `/movies`, `/halls`, `/showtimes` | ADMIN |

## Báo cáo thiết kế

- `csdl.drawio.png` — sơ đồ CSDL
- `kientruchethong.drawio.png` — kiến trúc hệ thống
- `datvathanhtoan.drawio.png` — sơ đồ luồng đặt vé/thanh toán

## Start/stop cả hệ thống (nếu chạy từ thư mục gốc `cinym/`)

```bash
bash start.sh
bash stop.sh
```

Lưu ý: Script `start.sh` đã được cấu hình tối ưu để tự động dọn dẹp port cũ, build NestJS backend và chạy song song Backend API (3001) cùng Frontend UI mới `frontend-moi` (3000).

## Kiến trúc front-end

Frontend mặc định của dự án là `frontend-moi` (React 19 + TanStack Router + Vite + Tailwind CSS 4), được kết nối trực tiếp với NestJS Backend API và tích hợp sẵn hệ thống xác thực tài khoản (hỗ trợ đăng nhập nhanh tài khoản mẫu: Admin, Staff, Khách hàng).

## Ghi chú cho dev

- Frontend cũ trong `frontend/` vẫn được giữ lại làm tham chiếu.
- File docs trong gốc `cinym/`: `csdl.drawio.png`, `kientruchethong.drawio.png`, `datvathanhtoan.drawio.png`, `motahethong.odt`.
- CORS trong backend (`src/main.ts`) cho phép `localhost:3000`.
- Email mặc định chỉ log (dry-run) nếu chưa cấu hình SMTP.
