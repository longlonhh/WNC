import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { TicketService } from '../booking/ticket.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '../users/user.entity';

/**
 * Staff / Ticket Checker
 * "Sử dụng thiết bị quét/nhập mã QR Code hoặc Mã vé điện tử... Chuyển trạng thái
 *  vé sang 'Đã check-in / Đã soát'"
 */
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class StaffController {
  constructor(private readonly ticketService: TicketService) {}

  /** POST /staff/checkin { ticketCode } -> xác thực vé + check-in */
  @Post('checkin')
  checkin(@Request() req, @Body() body: { ticketCode: string }) {
    return this.ticketService.checkinTicket(body.ticketCode, req.user.userId);
  }
}
