import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat, SeatType, SeatStatus } from './seat.entity';
import { CinemaHall, HallType } from './cinema-hall.entity';
import { CreateHallDto } from './dto/create-hall.dto';
import { GenerateSeatsDto } from './dto/generate-seats.dto';

@Injectable()
export class HallsService {
  constructor(
    @InjectRepository(CinemaHall) private readonly hallRepo: Repository<CinemaHall>,
    @InjectRepository(Seat) private readonly seatRepo: Repository<Seat>,
  ) {}

  findAll(): Promise<CinemaHall[]> {
    return this.hallRepo.find({ order: { hallId: 'ASC' } });
  }

  async findOne(id: number): Promise<CinemaHall> {
    const hall = await this.hallRepo.findOneBy({ hallId: id });
    if (!hall) throw new NotFoundException('Không tìm thấy phòng chiếu');
    return hall;
  }

  getSeats(hallId: number): Promise<Seat[]> {
    return this.seatRepo.find({ where: { hallId }, order: { seatNumber: 'ASC' } });
  }

  async create(dto: CreateHallDto): Promise<CinemaHall> {
    const hall = this.hallRepo.create({
      hallName: dto.hallName,
      totalSeats: 0,
      hallType: dto.hallType || HallType.D2,
    });
    return this.hallRepo.save(hall);
  }

  /**
   * "Thêm phòng chiếu, cấu hình số lượng hàng/cột và thiết lập sơ đồ ghế
   *  (định danh loại ghế Thường, VIP, Couple)"
   * Cấu trúc: hàng cuối = COUPLE, 2 hàng kế cuối = VIP, còn lại STANDARD
   */
  async generateSeats(hallId: number, dto: GenerateSeatsDto) {
    const hall = await this.findOne(hallId);
    await this.seatRepo.delete({ hallId });

    const seats: Seat[] = [];
    const rowLabels = 'ABCDEFGHIJKLMNOP'.split('');
    for (let r = 0; r < dto.rows; r++) {
      for (let c = 1; c <= dto.cols; c++) {
        let seatType: SeatType = SeatType.STANDARD;
        if (r === dto.rows - 1) seatType = SeatType.COUPLE;
        else if (r >= dto.rows - 3) seatType = SeatType.VIP;

        seats.push(this.seatRepo.create({
          hallId,
          seatNumber: `${rowLabels[r]}${String(c).padStart(2, '0')}`,
          seatType,
          status: SeatStatus.ACTIVE,
        }));
      }
    }
    await this.seatRepo.save(seats);

    hall.totalSeats = seats.length;
    await this.hallRepo.save(hall);
    return { hall, seatsCreated: seats.length };
  }

  async update(id: number, dto: Partial<CreateHallDto>) {
    await this.findOne(id);
    await this.hallRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.hallRepo.delete(id);
  }
}
