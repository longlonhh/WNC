import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateShowtimeDto {
  @Type(() => Number)
  @IsInt()
  movieId: number;

  @Type(() => Number)
  @IsInt()
  hallId: number;

  /** ISO datetime: 2026-09-25T19:30:00 (giờ địa phương) */
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn thời gian bắt đầu' })
  startTime: string;

  @Type(() => Number)
  @IsInt()
  @Min(1000, { message: 'Giá vé tối thiểu 1.000đ' })
  ticketPrice: number;
}
