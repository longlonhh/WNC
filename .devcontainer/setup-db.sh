#!/bin/bash
# setup-db.sh - chạy tự động ở postCreateCommand (một lần khi tạo container)
# 1. Chạy MySQL  2. Tạo user + DB  3. Tạo schema 7 bảng  4. npm install + seed + build
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"

echo "═══ 1/5 Khởi động MySQL ═══"
bash "$DIR/start-mysql.sh"

echo "═══ 2/5 Tạo user + database ═══"
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS cinema_booking_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '04112005';
FLUSH PRIVILEGES;
SQL
echo "✔ DB: cinema_booking_db — root / 04112005"

echo "═══ 3/5 Tạo schema 7 bảng (Users, Movies, CinemaHalls, Seats, Showtimes, Bookings, Tickets) ═══"
mysql -u root -p'04112005' cinema_booking_db <<'SQL'
CREATE TABLE IF NOT EXISTS Users (
  user_id INT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role ENUM('ADMIN','CUSTOMER','STAFF') NOT NULL DEFAULT 'CUSTOMER',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Movies (
  movie_id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  duration_min INT NOT NULL,
  poster_url VARCHAR(500) DEFAULT NULL,
  trailer_url VARCHAR(500) DEFAULT NULL,
  release_date DATE NOT NULL,
  status ENUM('NOW_SHOWING','COMING_SOON','ENDED') DEFAULT 'NOW_SHOWING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CinemaHalls (
  hall_id INT NOT NULL AUTO_INCREMENT,
  hall_name VARCHAR(50) NOT NULL,
  total_seats INT NOT NULL DEFAULT '0',
  hall_type ENUM('2D','3D','IMAX') DEFAULT '2D',
  PRIMARY KEY (hall_id),
  UNIQUE KEY hall_name (hall_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Seats (
  seat_id INT NOT NULL AUTO_INCREMENT,
  hall_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  seat_type ENUM('STANDARD','VIP','COUPLE') NOT NULL DEFAULT 'STANDARD',
  status ENUM('ACTIVE','MAINTENANCE') DEFAULT 'ACTIVE',
  PRIMARY KEY (seat_id),
  UNIQUE KEY unique_seat_per_hall (hall_id, seat_number),
  CONSTRAINT Seats_ibfk_1 FOREIGN KEY (hall_id) REFERENCES CinemaHalls (hall_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Showtimes (
  showtime_id INT NOT NULL AUTO_INCREMENT,
  movie_id INT NOT NULL,
  hall_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (showtime_id),
  KEY movie_id (movie_id),
  KEY hall_id (hall_id),
  CONSTRAINT Showtimes_ibfk_1 FOREIGN KEY (movie_id) REFERENCES Movies (movie_id) ON DELETE CASCADE,
  CONSTRAINT Showtimes_ibfk_2 FOREIGN KEY (hall_id) REFERENCES CinemaHalls (hall_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Bookings (
  booking_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  status ENUM('PENDING','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
  payment_qr_code VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (booking_id),
  KEY user_id (user_id),
  CONSTRAINT Bookings_ibfk_1 FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Tickets (
  ticket_id INT NOT NULL AUTO_INCREMENT,
  booking_id INT NOT NULL,
  showtime_id INT NOT NULL,
  seat_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  ticket_code VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (ticket_id),
  UNIQUE KEY unique_seat_per_showtime (showtime_id, seat_id),
  UNIQUE KEY ticket_code (ticket_code),
  KEY booking_id (booking_id),
  KEY seat_id (seat_id),
  CONSTRAINT Tickets_ibfk_1 FOREIGN KEY (booking_id) REFERENCES Bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT Tickets_ibfk_2 FOREIGN KEY (showtime_id) REFERENCES Showtimes (showtime_id) ON DELETE CASCADE,
  CONSTRAINT Tickets_ibfk_3 FOREIGN KEY (seat_id) REFERENCES Seats (seat_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL
echo "✔ Schema 7 bảng đã sẵn sàng"

echo "═══ 4/5 Cài dependencies (backend + frontend) ═══"
cd "$ROOT/backend"  && npm install --no-audit --no-fund
cd "$ROOT/frontend" && npm install --no-audit --no-fund

echo "═══ 5/5 Seed dữ liệu mẫu + build backend ═══"
cd "$ROOT/backend" && npm run seed && npm run build

echo ""
echo "✅ Dev container sẵn sàng!"
echo "   ▶ bash start.sh  → Backend :3001 + Frontend :3000"
