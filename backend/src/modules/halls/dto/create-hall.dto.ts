import { IsString, IsNotEmpty, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { HallType } from '../cinema-hall.entity';

export class CreateHallDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  @MaxLength(50)
  hallName: string;

  @IsOptional()
  @IsEnum(HallType, { message: 'Loại phòng phải là 2D, 3D hoặc IMAX' })
  hallType?: HallType;
}
