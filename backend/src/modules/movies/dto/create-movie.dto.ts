import {
  IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsUrl, IsEnum, IsDateString, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovieStatus } from '../movie.entity';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phim không được để trống' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600, { message: 'Thời lượng tối đa 600 phút' })
  durationMin: number;

  @IsOptional()
  @IsUrl({}, { message: 'Poster URL không hợp lệ' })
  posterUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Trailer URL không hợp lệ' })
  trailerUrl?: string;

  @IsDateString({}, { message: 'Ngày phát hành không hợp lệ (YYYY-MM-DD)' })
  releaseDate: string;

  @IsOptional()
  @IsEnum(MovieStatus, { message: 'Trạng thái phải là NOW_SHOWING, COMING_SOON hoặc ENDED' })
  status?: MovieStatus;
}
