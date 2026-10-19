import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsInt, IsString, Min, ValidateNested, IsOptional,
} from 'class-validator';

class SeatSelection {
  @Type(() => Number)
  @IsInt()
  seatId: number;
}

export class CreateBookingDto {
  /** mã xuất chiếu (showtimeId) */
  @Type(() => Number)
  @IsInt()
  showtimeId: number;

  /** danh sách ghế khách chọn */
  @IsArray()
  @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất 1 ghế' })
  @ValidateNested({ each: true })
  @Type(() => SeatSelection)
  seats: SeatSelection[];

  @IsOptional()
  @IsString()
  promotionCode?: string;
}
