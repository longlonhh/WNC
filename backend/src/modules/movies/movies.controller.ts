import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Public } from '../../common/public.decorator';
import { UserRole } from '../users/user.entity';
import { MovieStatus } from './movie.entity';

@Controller('movies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MoviesController {
  constructor(
    @InjectRepository(Movie) private readonly movieRepo: Repository<Movie>,
  ) {}

  /** Danh sách phim (công khai), lọc: ?status=NOW_SHOWING|COMING_SOON|ENDED */
  @Public()
  @Get()
  findAll(@Query('status') status?: MovieStatus) {
    const where = status ? { status } : {};
    return this.movieRepo.find({ where, order: { releaseDate: 'DESC' } });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movieRepo.findOneBy({ movieId: id });
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateMovieDto) {
    const movie = this.movieRepo.create(dto);
    return this.movieRepo.save(movie);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovieDto) {
    await this.movieRepo.update(id, dto);
    return this.movieRepo.findOneBy({ movieId: id });
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movieRepo.delete(id);
  }
}
