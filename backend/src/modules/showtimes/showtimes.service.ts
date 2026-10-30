import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './showtime.entity';
import { Movie } from '../movies/movie.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime) private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Movie) private readonly movieRepo: Repository<Movie>,
  ) {}

  /** Danh sách suất chiếu kèm phim + phòng: ?movieId=&date=YYYY-MM-DD */
  async findAll(movieId?: number, date?: string): Promise<Showtime[]> {
    const qb = this.showtimeRepo
      .createQueryBuilder('st')
      .leftJoinAndSelect('st.movie', 'm')
      .leftJoinAndSelect('st.hall', 'h')
      .orderBy('st.start_time', 'ASC');

    if (movieId) qb.andWhere('st.movie_id = :movieId', { movieId });
    if (date) qb.andWhere('DATE(st.start_time) = :date', { date });
    return qb.getMany();
  }

  async findOne(id: number): Promise<Showtime> {
    const st = await this.showtimeRepo.findOne({
      where: { showtimeId: id },
      relations: ['movie', 'hall'],
    });
    if (!st) throw new NotFoundException('Không tìm thấy suất chiếu');
    return st;
  }

  /** "Lập lịch chiếu theo ngày/giờ, gán phòng chiếu, thiết lập giá vé gốc" */
  async create(dto: CreateShowtimeDto): Promise<Showtime> {
    const movie = await this.movieRepo.findOneBy({ movieId: dto.movieId });
    if (!movie) throw new NotFoundException('Không tìm thấy phim');

    const startTime = new Date(dto.startTime);
    if (isNaN(startTime.getTime())) throw new BadRequestException('Thời gian không hợp lệ');

    const endTime = new Date(startTime.getTime() + movie.durationMin * 60000);

    // Chống trùng phòng: overlap [start,end) x [s2,e2)
    const overlap = await this.showtimeRepo
      .createQueryBuilder('st')
      .where('st.hall_id = :hallId', { hallId: dto.hallId })
      .andWhere('st.start_time < :endTime', { endTime })
      .andWhere('st.end_time > :startTime', { startTime })
      .getOne();
    if (overlap) throw new BadRequestException('Phòng chiếu đã có suất khác trong khung giờ này');

    const st = this.showtimeRepo.create({
      movieId: dto.movieId,
      hallId: dto.hallId,
      startTime,
      endTime,
      ticketPrice: dto.ticketPrice,
    });
    return this.showtimeRepo.save(st);
  }

  async update(id: number, dto: Partial<CreateShowtimeDto>): Promise<Showtime> {
    const st = await this.findOne(id);
    if (dto.startTime) {
      const movie = await this.movieRepo.findOneBy({ movieId: dto.movieId ?? st.movieId });
      const startTime = new Date(dto.startTime);
      if (isNaN(startTime.getTime())) throw new BadRequestException('Thời gian không hợp lệ');
      st.startTime = startTime;
      st.endTime = new Date(startTime.getTime() + (movie?.durationMin ?? 0) * 60000);
    }
    if (dto.hallId) st.hallId = dto.hallId;
    if (dto.ticketPrice !== undefined) st.ticketPrice = dto.ticketPrice;
    if (dto.movieId) st.movieId = dto.movieId;
    return this.showtimeRepo.save(st);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.showtimeRepo.delete(id);
  }
}
