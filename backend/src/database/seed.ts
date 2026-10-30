/* eslint-disable prettier/prettier */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed dữ liệu mẫu theo schema 7 bảng trong DB cinema_booking_db
 * Chạy: npm run seed
 */
async function seed() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cinema_booking_db',
    charset: 'utf8mb4_unicode_ci',
  });
  await ds.initialize();
  const q = (sql: string, params: any[] = []) => ds.query(sql, params);

  // ===== 1. Users (ADMIN / STAFF / CUSTOMER) =====
  const users = [
    ['Quản Trị Viên', 'admin@cinema.vn', 'ADMIN'],
    ['Nguyễn Văn Sọt', 'staff@cinema.vn', 'STAFF'],
    ['Khách Hàng A', 'khach@cinema.vn', 'CUSTOMER'],
  ];
  for (const [fullName, email, role] of users) {
    const hash = await bcrypt.hash('123456', 10);
    await q(
      `INSERT INTO Users (full_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
      [fullName, email, hash, '0900000000', role],
    );
  }
  console.log('✔ Users: admin@cinema.vn / staff@cinema.vn / khach@cinema.vn (mật khẩu 123456)');

  // ===== 2. Movies =====
  const movies = [
    ['Avatar: Fire and Ash', 'Phần ba của loạt Avatar đưa khán giả trở lại Pandora.', 195, 'https://image.tmdb.org/t/p/w500/avatar3.jpg', '2026-12-18', 'COMING_SOON'],
    ['Mai', 'Tác phẩm điện ảnh tình cảm gia đình.', 131, 'https://image.tmdb.org/t/p/w500/mai.jpg', '2026-02-10', 'NOW_SHOWING'],
    ['Lật Mặt 8', 'Phim hành động - phiêu lưu của đạo diễn Lý Hải.', 122, 'https://image.tmdb.org/t/p/w500/latmat8.jpg', '2026-05-30', 'NOW_SHOWING'],
    ['Kung Fu Panda 4', 'Po trở lại với thử thách mới.', 94, 'https://image.tmdb.org/t/p/w500/kfp4.jpg', '2026-03-08', 'NOW_SHOWING'],
    ['Nhà Giả Kim', 'Chuyển thể từ tiểu thuyết kinh điển.', 118, 'https://image.tmdb.org/t/p/w500/alchemist.jpg', '2026-04-18', 'COMING_SOON'],
  ];
  for (const [title, description, durationMin, posterUrl, releaseDate, status] of movies) {
    const dup = await q(`SELECT movie_id FROM Movies WHERE title = ?`, [title]);
    if (dup.length > 0) continue;
    await q(
      `INSERT INTO Movies (title, description, duration_min, poster_url, release_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, durationMin, posterUrl, releaseDate, status],
    );
  }
  console.log('✔ Movies: 5 phim mẫu');

  // ===== 3. CinemaHalls + Seats (sơ đồ ghế: 8 hàng x 10 cột = 80 ghế) =====
  const halls = [
    ['Phòng 01 - IMAX', 'IMAX'],
    ['Phòng 02 - Standard', '2D'],
    ['Phòng 03 - 3D', '3D'],
  ];
  for (const [hallName, hallType] of halls) {
    await q(
      `INSERT INTO CinemaHalls (hall_name, total_seats, hall_type)
       VALUES (?, 0, ?)
       ON DUPLICATE KEY UPDATE hall_type = VALUES(hall_type)`,
      [hallName, hallType],
    );
  }

  const hallRows: any[] = await q(`SELECT hall_id, hall_name FROM CinemaHalls`);
  for (const hall of hallRows) {
    const exists = await q(`SELECT COUNT(*) AS c FROM Seats WHERE hall_id = ?`, [hall.hall_id]);
    if (Number(exists[0].c) > 0) continue;

    const rows = 8, cols = 10;
    const seats: any[] = [];
    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let c = 1; c <= cols; c++) {
        let seatType = 'STANDARD';
        if (r === rows - 1) seatType = 'COUPLE';
        else if (r >= rows - 3) seatType = 'VIP';
        seats.push([hall.hall_id, `${rowLabel}${String(c).padStart(2, '0')}`, seatType]);
      }
    }
    for (const s of seats) {
      await q(
        `INSERT IGNORE INTO Seats (hall_id, seat_number, seat_type, status) VALUES (?, ?, ?, 'ACTIVE')`,
        s,
      );
    }
    await q(`UPDATE CinemaHalls SET total_seats = ? WHERE hall_id = ?`, [seats.length, hall.hall_id]);
  }
  console.log('✔ CinemaHalls: 3 phòng, mỗi phòng 80 ghế (A01-J10, có VIP + Couple)');

  // ===== 4. Showtimes: 5 ngày tới, mỗi phim NOW_SHOWING 2 suất/ngày =====
  const nowShowing: any[] = await q(`SELECT movie_id, duration_min FROM Movies WHERE status='NOW_SHOWING'`);
  const hallIds: any[] = await q(`SELECT hall_id FROM CinemaHalls`);
  let created = 0;
  for (let d = 0; d < 6; d++) {
    const day = new Date();
    day.setDate(day.getDate() + d); // gồm cả hôm nay
    for (let i = 0; i < nowShowing.length; i++) {
      const movie = nowShowing[i];
      const hall = hallIds[i % hallIds.length];
      for (const hour of [15, 19]) {
        const start = new Date(day);
        start.setHours(hour, 30, 0, 0);
        const end = new Date(start.getTime() + movie.duration_min * 60000);
        if (start <= new Date()) continue; // bỏ qua giờ đã qua
        const price = hour === 19 ? 120000 : 100000;

        const dup = await q(
          `SELECT COUNT(*) AS c FROM Showtimes WHERE hall_id=? AND start_time < ? AND end_time > ?`,
          [hall.hall_id, end, start],
        );
        if (Number(dup[0].c) > 0) continue;

        await q(
          `INSERT INTO Showtimes (movie_id, hall_id, start_time, end_time, ticket_price)
           VALUES (?, ?, ?, ?, ?)`,
          [movie.movie_id, hall.hall_id, start, end, price],
        );
        created++;
      }
    }
  }
  console.log(`✔ Showtimes: tạo ${created} suất chiếu trong 5 ngày tới`);

  await ds.destroy();
  console.log('✅ Seed hoàn tất!');
}

seed().catch((e) => {
  console.error('Seed lỗi:', e);
  process.exit(1);
});
