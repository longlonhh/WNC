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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinemaHall = exports.HallType = void 0;
const typeorm_1 = require("typeorm");
const seat_entity_1 = require("./seat.entity");
const showtime_entity_1 = require("../showtimes/showtime.entity");
var HallType;
(function (HallType) {
    HallType["D2"] = "2D";
    HallType["D3"] = "3D";
    HallType["IMAX"] = "IMAX";
})(HallType || (exports.HallType = HallType = {}));
let CinemaHall = class CinemaHall {
};
exports.CinemaHall = CinemaHall;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'hall_id' }),
    __metadata("design:type", Number)
], CinemaHall.prototype, "hallId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hall_name', length: 50, unique: true }),
    __metadata("design:type", String)
], CinemaHall.prototype, "hallName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_seats', default: 0 }),
    __metadata("design:type", Number)
], CinemaHall.prototype, "totalSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hall_type', type: 'enum', enum: HallType, default: HallType.D2 }),
    __metadata("design:type", String)
], CinemaHall.prototype, "hallType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => seat_entity_1.Seat, (s) => s.hall),
    __metadata("design:type", Array)
], CinemaHall.prototype, "seats", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => showtime_entity_1.Showtime, (s) => s.hall),
    __metadata("design:type", Array)
], CinemaHall.prototype, "showtimes", void 0);
exports.CinemaHall = CinemaHall = __decorate([
    (0, typeorm_1.Entity)('CinemaHalls')
], CinemaHall);
//# sourceMappingURL=cinema-hall.entity.js.map