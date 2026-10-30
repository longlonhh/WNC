import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { HallsService } from './halls.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { GenerateSeatsDto } from './dto/generate-seats.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Public } from '../../common/public.decorator';
import { UserRole } from '../users/user.entity';

@Controller('halls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Public()
  @Get()
  findAll() {
    return this.hallsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hallsService.findOne(id);
  }

  /** Lấy sơ đồ ghế của phòng (công khai) */
  @Public()
  @Get(':id/seats')
  getSeats(@Param('id', ParseIntPipe) id: number) {
    return this.hallsService.getSeats(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateHallDto) {
    return this.hallsService.create(dto);
  }

  /** Tạo sơ đồ ghế: hàng x cột + tỷ lệ loại ghế */
  @Roles(UserRole.ADMIN)
  @Post(':id/seats/generate')
  generateSeats(@Param('id', ParseIntPipe) id: number, @Body() dto: GenerateSeatsDto) {
    return this.hallsService.generateSeats(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.hallsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hallsService.remove(id);
  }
}
