import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketController } from './ticket.controller';
import { SeatsStatusController } from './seats.controller';
import { TicketService } from './ticket.service';
import { SeatLockService } from './seat-lock.service';
import { BookingTimeoutService } from './booking-timeout.service';
import { PaymentGatewayService } from '../payments/payment-gateway.service';
import { EmailService } from '../emails/email.service';
import { Booking } from './booking.entity';
import { Ticket } from './ticket.entity';
import { Seat } from '../halls/seat.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { User } from '../users/user.entity';

/**
 * Ticket & Booking Module
 * TicketController : tiếp nhận HTTP Request (POST /bookings, GET /bookings/my...)
 * TicketService    : Business Logic (khóa ghế tạm thời, tính tổng tiền, tạo đơn, cập nhật trạng thái)
 * Repository       : làm việc với bảng Tickets, Seats, Bookings
 */
@Module({
  imports: [TypeOrmModule.forFeature([Booking, Ticket, Seat, Showtime, User])],
  controllers: [TicketController, SeatsStatusController],
  providers: [TicketService, SeatLockService, BookingTimeoutService, PaymentGatewayService, EmailService],
  exports: [TicketService],
})
export class BookingModule {}
