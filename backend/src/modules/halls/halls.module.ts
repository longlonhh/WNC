import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HallsController } from './halls.controller';
import { HallsService } from './halls.service';
import { CinemaHall } from './cinema-hall.entity';
import { Seat } from './seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CinemaHall, Seat])],
  controllers: [HallsController],
  providers: [HallsService],
  exports: [TypeOrmModule],
})
export class HallsModule {}
