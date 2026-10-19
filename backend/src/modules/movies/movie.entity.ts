import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Showtime } from '../showtimes/showtime.entity';

export enum MovieStatus {
  NOW_SHOWING = 'NOW_SHOWING',
  COMING_SOON = 'COMING_SOON',
  ENDED = 'ENDED',
}

@Entity('Movies')
export class Movie {
  @PrimaryGeneratedColumn({ name: 'movie_id' })
  movieId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'duration_min' })
  durationMin: number;

  @Column({ name: 'poster_url', length: 500, nullable: true })
  posterUrl: string;

  @Column({ name: 'trailer_url', length: 500, nullable: true })
  trailerUrl: string;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate: string;

  @Column({ type: 'enum', enum: MovieStatus, default: MovieStatus.NOW_SHOWING })
  status: MovieStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Showtime, (s) => s.movie)
  showtimes: Showtime[];
}
