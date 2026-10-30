import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CinemaHall } from './cinema-hall.entity';
import { Ticket } from '../booking/ticket.entity';

export enum SeatType {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  COUPLE = 'COUPLE',
}

export enum SeatStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('Seats')
export class Seat {
  @PrimaryGeneratedColumn({ name: 'seat_id' })
  seatId: number;

  @Column({ name: 'hall_id' })
  hallId: number;

  @Column({ name: 'seat_number', length: 10 })
  seatNumber: string;

  @Column({ name: 'seat_type', type: 'enum', enum: SeatType, default: SeatType.STANDARD })
  seatType: SeatType;

  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.ACTIVE })
  status: SeatStatus;

  @ManyToOne(() => CinemaHall, (h) => h.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hall_id' })
  hall: CinemaHall;

  @OneToMany(() => Ticket, (t) => t.seat)
  tickets: Ticket[];
}
