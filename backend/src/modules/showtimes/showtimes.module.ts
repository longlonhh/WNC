import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesService } from './showtimes.service';
import { Showtime } from './showtime.entity';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Showtime]), MoviesModule],
  controllers: [ShowtimesController],
  providers: [ShowtimesService],
  exports: [TypeOrmModule],
})
export class ShowtimesModule {}
