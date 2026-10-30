import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Seat } from './seat.entity';
import { Showtime } from '../showtimes/showtime.entity';

export enum HallType {
  D2 = '2D',
  D3 = '3D',
  IMAX = 'IMAX',
}

@Entity('CinemaHalls')
export class CinemaHall {
  @PrimaryGeneratedColumn({ name: 'hall_id' })
  hallId: number;

  @Column({ name: 'hall_name', length: 50, unique: true })
  hallName: string;

  @Column({ name: 'total_seats', default: 0 })
  totalSeats: number;

  @Column({ name: 'hall_type', type: 'enum', enum: HallType, default: HallType.D2 })
  hallType: HallType;

  @OneToMany(() => Seat, (s) => s.hall)
  seats: Seat[];

  @OneToMany(() => Showtime, (s) => s.hall)
  showtimes: Showtime[];
}
