import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Movie } from '../movies/movie.entity';
import { CinemaHall } from '../halls/cinema-hall.entity';
import { Ticket } from '../booking/ticket.entity';

@Entity('Showtimes')
export class Showtime {
  @PrimaryGeneratedColumn({ name: 'showtime_id' })
  showtimeId: number;

  @Column({ name: 'movie_id' })
  movieId: number;

  @Column({ name: 'hall_id' })
  hallId: number;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @Column({ name: 'ticket_price', type: 'decimal', precision: 10, scale: 2 })
  ticketPrice: number;

  @ManyToOne(() => Movie, (m) => m.showtimes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => CinemaHall, (h) => h.showtimes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hall_id' })
  hall: CinemaHall;

  @OneToMany(() => Ticket, (t) => t.showtime)
  tickets: Ticket[];
}
