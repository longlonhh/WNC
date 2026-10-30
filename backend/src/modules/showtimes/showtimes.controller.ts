import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Public } from '../../common/public.decorator';
import { UserRole } from '../users/user.entity';

@Controller('showtimes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  /**
   * Lịch chiếu (công khai):
   *   GET /showtimes?movieId=1          -> suất của 1 phim
   *   GET /showtimes?date=2026-09-25    -> suất theo ngày
   */
  @Public()
  @Get()
  findAll(@Query('movieId') movieId?: string, @Query('date') date?: string) {
    return this.showtimesService.findAll(movieId ? +movieId : undefined, date);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.findOne(id);
  }

  /** "Lập lịch chiếu cho từng phim theo ngày/giờ, gán vào phòng chiếu cụ thể và thiết lập giá vé gốc" */
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateShowtimeDto) {
    return this.showtimesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateShowtimeDto>) {
    return this.showtimesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.remove(id);
  }
}
