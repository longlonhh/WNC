"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowtimesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const showtime_entity_1 = require("./showtime.entity");
const movie_entity_1 = require("../movies/movie.entity");
let ShowtimesService = class ShowtimesService {
    constructor(showtimeRepo, movieRepo) {
        this.showtimeRepo = showtimeRepo;
        this.movieRepo = movieRepo;
    }
    async findAll(movieId, date) {
        const qb = this.showtimeRepo
            .createQueryBuilder('st')
            .leftJoinAndSelect('st.movie', 'm')
            .leftJoinAndSelect('st.hall', 'h')
            .orderBy('st.start_time', 'ASC');
        if (movieId)
            qb.andWhere('st.movie_id = :movieId', { movieId });
        if (date)
            qb.andWhere('DATE(st.start_time) = :date', { date });
        return qb.getMany();
    }
    async findOne(id) {
        const st = await this.showtimeRepo.findOne({
            where: { showtimeId: id },
            relations: ['movie', 'hall'],
        });
        if (!st)
            throw new common_1.NotFoundException('Không tìm thấy suất chiếu');
        return st;
    }
    async create(dto) {
        const movie = await this.movieRepo.findOneBy({ movieId: dto.movieId });
        if (!movie)
            throw new common_1.NotFoundException('Không tìm thấy phim');
        const startTime = new Date(dto.startTime);
        if (isNaN(startTime.getTime()))
            throw new common_1.BadRequestException('Thời gian không hợp lệ');
        const endTime = new Date(startTime.getTime() + movie.durationMin * 60000);
        const overlap = await this.showtimeRepo
            .createQueryBuilder('st')
            .where('st.hall_id = :hallId', { hallId: dto.hallId })
            .andWhere('st.start_time < :endTime', { endTime })
            .andWhere('st.end_time > :startTime', { startTime })
            .getOne();
        if (overlap)
            throw new common_1.BadRequestException('Phòng chiếu đã có suất khác trong khung giờ này');
        const st = this.showtimeRepo.create({
            movieId: dto.movieId,
            hallId: dto.hallId,
            startTime,
            endTime,
            ticketPrice: dto.ticketPrice,
        });
        return this.showtimeRepo.save(st);
    }
    async update(id, dto) {
        const st = await this.findOne(id);
        if (dto.startTime) {
            const movie = await this.movieRepo.findOneBy({ movieId: dto.movieId ?? st.movieId });
            const startTime = new Date(dto.startTime);
            if (isNaN(startTime.getTime()))
                throw new common_1.BadRequestException('Thời gian không hợp lệ');
            st.startTime = startTime;
            st.endTime = new Date(startTime.getTime() + (movie?.durationMin ?? 0) * 60000);
        }
        if (dto.hallId)
            st.hallId = dto.hallId;
        if (dto.ticketPrice !== undefined)
            st.ticketPrice = dto.ticketPrice;
        if (dto.movieId)
            st.movieId = dto.movieId;
        return this.showtimeRepo.save(st);
    }
    async remove(id) {
        await this.findOne(id);
        return this.showtimeRepo.delete(id);
    }
};
exports.ShowtimesService = ShowtimesService;
exports.ShowtimesService = ShowtimesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(showtime_entity_1.Showtime)),
    __param(1, (0, typeorm_1.InjectRepository)(movie_entity_1.Movie)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ShowtimesService);
//# sourceMappingURL=showtimes.service.js.map