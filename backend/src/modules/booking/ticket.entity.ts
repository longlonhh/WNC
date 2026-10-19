import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { Seat } from '../halls/seat.entity';

@Entity('Tickets')
export class Ticket {
  @PrimaryGeneratedColumn({ name: 'ticket_id' })
  ticketId: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'showtime_id' })
  showtimeId: number;

  @Column({ name: 'seat_id' })
  seatId: number;

  /** Giá vé thực tế sau khi tính loại ghế (STANDARD x1, VIP x1.5, COUPLE x2) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  /** Mã vé điện tử, nội dung mã QR */
  @Column({ name: 'ticket_code', length: 50, nullable: true, unique: true })
  ticketCode: string;

  @ManyToOne(() => Booking, (b) => b.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Showtime, (t) => t.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'showtime_id' })
  showtime: Showtime;

  @ManyToOne(() => Seat, (s) => s.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;
}
