import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class GenerateSeatsDto {
  @Type(() => Number)
  @IsInt()
  @Min(2, { message: 'Số hàng tối thiểu 2' })
  @Max(16, { message: 'Số hàng tối đa 16' })
  rows: number;

  @Type(() => Number)
  @IsInt()
  @Min(4, { message: 'Số cột tối thiểu 4' })
  @Max(20, { message: 'Số cột tối đa 20' })
  cols: number;
}
