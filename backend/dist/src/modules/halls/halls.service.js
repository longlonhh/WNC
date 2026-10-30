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
exports.HallsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const seat_entity_1 = require("./seat.entity");
const cinema_hall_entity_1 = require("./cinema-hall.entity");
let HallsService = class HallsService {
    constructor(hallRepo, seatRepo) {
        this.hallRepo = hallRepo;
        this.seatRepo = seatRepo;
    }
    findAll() {
        return this.hallRepo.find({ order: { hallId: 'ASC' } });
    }
    async findOne(id) {
        const hall = await this.hallRepo.findOneBy({ hallId: id });
        if (!hall)
            throw new common_1.NotFoundException('Không tìm thấy phòng chiếu');
        return hall;
    }
    getSeats(hallId) {
        return this.seatRepo.find({ where: { hallId }, order: { seatNumber: 'ASC' } });
    }
    async create(dto) {
        const hall = this.hallRepo.create({
            hallName: dto.hallName,
            totalSeats: 0,
            hallType: dto.hallType || cinema_hall_entity_1.HallType.D2,
        });
        return this.hallRepo.save(hall);
    }
    async generateSeats(hallId, dto) {
        const hall = await this.findOne(hallId);
        await this.seatRepo.delete({ hallId });
        const seats = [];
        const rowLabels = 'ABCDEFGHIJKLMNOP'.split('');
        for (let r = 0; r < dto.rows; r++) {
            for (let c = 1; c <= dto.cols; c++) {
                let seatType = seat_entity_1.SeatType.STANDARD;
                if (r === dto.rows - 1)
                    seatType = seat_entity_1.SeatType.COUPLE;
                else if (r >= dto.rows - 3)
                    seatType = seat_entity_1.SeatType.VIP;
                seats.push(this.seatRepo.create({
                    hallId,
                    seatNumber: `${rowLabels[r]}${String(c).padStart(2, '0')}`,
                    seatType,
                    status: seat_entity_1.SeatStatus.ACTIVE,
                }));
            }
        }
        await this.seatRepo.save(seats);
        hall.totalSeats = seats.length;
        await this.hallRepo.save(hall);
        return { hall, seatsCreated: seats.length };
    }
    async update(id, dto) {
        await this.findOne(id);
        await this.hallRepo.update(id, dto);
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        return this.hallRepo.delete(id);
    }
};
exports.HallsService = HallsService;
exports.HallsService = HallsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cinema_hall_entity_1.CinemaHall)),
    __param(1, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], HallsService);
//# sourceMappingURL=halls.service.js.map