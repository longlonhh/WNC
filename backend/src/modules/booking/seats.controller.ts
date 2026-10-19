import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { Public } from '../../common/public.decorator';

/** API trạng thái ghế cho sơ đồ phòng chiếu (Ghế trống / đang giữ / đã bán) */
@Controller('showtimes')
export class SeatsStatusController {
  constructor(private readonly ticketService: TicketService) {}

  /** GET /showtimes/:id/seats-status -> sơ đồ ghế + trạng thái real-time */
  @Public()
  @Get(':id/seats-status')
  getSeatStatus(@Param('id', ParseIntPipe) showtimeId: number) {
    return this.ticketService.getSeatStatus(showtimeId);
  }
}
