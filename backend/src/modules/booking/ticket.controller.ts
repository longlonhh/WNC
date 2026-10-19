import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards, Request,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '../users/user.entity';

/**
 * TicketController - tiep nhan HTTP Request
 *   POST /bookings                     : tao don giu ghe (khoa ghe 8 phut)
 *   POST /bookings/:id/payment-request : tao yeu cau thanh toan VNPAY/MOMO
 *   POST /bookings/:id/payment-callback: callback cong thanh toan
 *   GET  /bookings/my                  : lich su giao dich
 *   GET  /bookings/:id                 : chi tiet don + ve dien tu
 *   PATCH /tickets/:code/checkin       : soat ve (Staff)
 */
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  createBooking(@Request() req, @Body() dto: CreateBookingDto) {
    return this.ticketService.createBooking(req.user.userId, dto);
  }

  @Post(':id/payment-request')
  createPaymentRequest(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { method: 'VNPAY' | 'MOMO' },
  ) {
    return this.ticketService.createPaymentRequest(req.user.userId, id, body.method);
  }

  @Post(':id/payment-callback')
  paymentCallback(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { success: boolean; transactionId?: string },
  ) {
    return this.ticketService.handlePaymentCallback(req.user.userId, id, body.success, body.transactionId);
  }

  @Get('my')
  findMyBookings(@Request() req) {
    return this.ticketService.findMyBookings(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findOneForUser(req.user.userId, req.user.role, id);
  }
}
