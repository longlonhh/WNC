import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [BookingModule],
  controllers: [StaffController],
})
export class StaffModule {}
