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
var BookingTimeoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingTimeoutService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("./booking.entity");
let BookingTimeoutService = BookingTimeoutService_1 = class BookingTimeoutService {
    constructor(bookingRepo) {
        this.bookingRepo = bookingRepo;
        this.logger = new common_1.Logger(BookingTimeoutService_1.name);
    }
    async cleanupExpiredBookings() {
        const cutoff = new Date(Date.now() - BookingTimeoutService_1.CUTOFF_MS);
        const stale = await this.bookingRepo.find({
            where: { status: booking_entity_1.BookingStatus.PENDING, bookingDate: (0, typeorm_2.LessThan)(cutoff) },
        });
        for (const booking of stale) {
            await this.bookingRepo.delete(booking.bookingId);
            this.logger.log(`Đơn PENDING #${booking.bookingId} quá hạn giữ ghế -> tự động hủy, ghế về trạng thái trống`);
        }
    }
};
exports.BookingTimeoutService = BookingTimeoutService;
BookingTimeoutService.CUTOFF_MS = 10 * 60 * 1000;
__decorate([
    (0, schedule_1.Interval)(30_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingTimeoutService.prototype, "cleanupExpiredBookings", null);
exports.BookingTimeoutService = BookingTimeoutService = BookingTimeoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BookingTimeoutService);
//# sourceMappingURL=booking-timeout.service.js.map