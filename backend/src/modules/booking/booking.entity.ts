import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Ticket } from './ticket.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('Bookings')
export class Booking {
  @PrimaryGeneratedColumn({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'booking_date' })
  bookingDate: Date;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ name: 'payment_qr_code', length: 500, nullable: true })
  paymentQrCode: string;

  @ManyToOne(() => User, (u) => u.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Ticket, (t) => t.booking)
  tickets: Ticket[];
}
