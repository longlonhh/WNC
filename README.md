# Hệ thống đặt vé xem phim (hoàn chỉnh)

Dự án được ghép từ **backend** (`cine/backend`) và **frontend UI/UX** (`uiux`) thành một folder duy nhất, kết nối trực tiếp qua REST API.

## Cấu trúc

```text
dat-ve-xem-phim/
├── backend/   # NestJS 10 + TypeORM + MySQL 8
└── frontend/  # React 19 + TanStack Start + Vite + react-bootstrap
```

## Yêu cầu môi trường

- Node.js 18+ (khuyến nghị 20+ để build frontend TanStack)
- MySQL 8 đã chạy, database `cinema_booking_db` (hoặc cấu hình lại trong `backend/.env`)
- npm

## Cấu hình

### Backend
File `backend/.env` đã có sẵn (sao chép từ `cine/backend/.env`):

```env
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

### Frontend
Tạo `frontend/.env.local` nếu muốn đổi URL backend:

```env
VITE_API_URL=http://localhost:3001
```

## Khởi động nhanh

### 1) Tạo dữ liệu mẫu
```bash
cd backend
npm install  # nếu chưa cài
npm run seed
```

### 2) Chạy backend (API)
```bash
cd backend
npm run start:dev  # dev
# hoặc
npm run build && node dist/src/main.js  # production
```
Backend lắng nghe tại `http://localhost:3001`

### 3) Chạy frontend
```bash
cd frontend
npm install  # nếu chưa cài
npm run dev
```
Frontend chạy tại cổng Vite mặc định (xem log).

## Tài khoản demo (mật khẩu: `123456`)

| Vai trò | Email | Chức năng |
|---|---|---|
| Khách hàng | `khach@cinema.vn` | Đặt vé, xem lịch sử |
| Nhân viên soát vé | `staff@cinema.vn` | Soát vé bằng mã QR/mã vé tại `/` → tab "Quản trị & Soát vé" |
| Quản trị viên | `admin@cinema.vn` | Soát vé + Dashboard doanh thu theo phim |

## Luồng đặt vé (tối đa 4 thao tác)

1. **Chọn phim** – Bấm "Đặt vé" trên phim đang chiếu
2. **Chọn suất** – Chọn ngày/giờ/rạp hiển thị sẵn
3. **Chọn ghế** – Chọn ghế trống (tự động tính tổng tiền theo loại ghế: Thường x1, VIP x1.5, Couple x2)
4. **Thanh toán** – Chọn MoMo/VNPay, nhấn "Thanh toán" để hoàn tất (backend giữ ghế 8 phút, cấp vé QR)

## Tính năng chính

- **Backend NestJS**: Auth JWT, Movies/Showtimes/Halls, Booking + Seat Lock (8 phút), Payment giả lập MoMo/VNPay, QR ticket, Staff check-in, Admin stats
- **Frontend react-bootstrap**: Giao diện theo phong cách Booking.com, tối ưu tương tác, thông minh (tự gợi ý suất gần nhất/ngày chiếu), không gây phiền nhiễu, hiển thị rõ trạng thái ghế
- **API client** (`frontend/src/lib/api.ts`): Tự động đính kèm token, xử lý lỗi thân thiện
- **Soát vé & Dashboard**: Chỉ dành cho STAFF/ADMIN, thống kê doanh thu trực tiếp từ DB

## API quan trọng

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/auth/login`, `/auth/register` | Công khai |
| GET | `/movies`, `/showtimes`, `/showtimes/:id/seats-status` | Công khai |
| POST | `/bookings` | Cần đăng nhập (giữ ghế) |
| POST | `/bookings/:id/payment-request` | Cần đăng nhập |
| POST | `/bookings/:id/payment-callback` | Cần đăng nhập (thành công → cấp vé QR) |
| POST | `/staff/checkin` | STAFF/ADMIN |
| GET | `/admin/stats/*` | ADMIN |

## Ghi chú kỹ thuật

- Frontend dùng `react-bootstrap` theo yêu cầu. Các thành phần UI hiện có của scaffold vẫn được giữ lại nhưng trang chính đã được thay bằng `CinemaApp` kết nối API.
- Backend giữ nguyên toàn bộ logic nghiệp vụ từ `cine/backend` (seat lock, timeout, QR, email, thống kê).
- Kiểm tra types: `cd frontend && npx tsc --noEmit`. Build frontend: cần Node 20+ do TanStack/Vite 8; build backend: `cd backend && npm run build`.
