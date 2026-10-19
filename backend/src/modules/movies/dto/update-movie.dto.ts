import {
  IsString, IsInt, Min, Max, IsOptional, IsUrl, IsEnum, IsDateString, MaxLength,
} from 'class-validator';
import { MovieStatus } from '../movie.entity';

/** UpdateMovieDto: tất cả field đều optional (thủ công, tránh phụ thuộc ESM) */
export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMin?: number;

  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @IsOptional()
  @IsUrl()
  trailerUrl?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;
}
