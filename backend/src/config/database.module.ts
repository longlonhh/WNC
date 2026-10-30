import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Movie } from '../modules/movies/movie.entity';
import { CinemaHall } from '../modules/halls/cinema-hall.entity';
import { Seat } from '../modules/halls/seat.entity';
import { Showtime } from '../modules/showtimes/showtime.entity';
import { Booking } from '../modules/booking/booking.entity';
import { Ticket } from '../modules/booking/ticket.entity';

/**
 * DatabaseModule - kết nối CSDL chung (TypeORM + MySQL/MariaDB)
 * DB đã thiết kế chuẩn hóa 7 bảng -> synchronize: false
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql' as const,
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cinema_booking_db',
        entities: [User, Movie, CinemaHall, Seat, Showtime, Booking, Ticket],
        synchronize: false,
        logging: false,
        charset: 'utf8mb4_unicode_ci',
      }),
    }),
  ],
})
export class DatabaseModule {}
