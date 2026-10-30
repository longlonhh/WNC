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
exports.Seat = exports.SeatStatus = exports.SeatType = void 0;
const typeorm_1 = require("typeorm");
const cinema_hall_entity_1 = require("./cinema-hall.entity");
const ticket_entity_1 = require("../booking/ticket.entity");
var SeatType;
(function (SeatType) {
    SeatType["STANDARD"] = "STANDARD";
    SeatType["VIP"] = "VIP";
    SeatType["COUPLE"] = "COUPLE";
})(SeatType || (exports.SeatType = SeatType = {}));
var SeatStatus;
(function (SeatStatus) {
    SeatStatus["ACTIVE"] = "ACTIVE";
    SeatStatus["MAINTENANCE"] = "MAINTENANCE";
})(SeatStatus || (exports.SeatStatus = SeatStatus = {}));
let Seat = class Seat {
};
exports.Seat = Seat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'seat_id' }),
    __metadata("design:type", Number)
], Seat.prototype, "seatId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hall_id' }),
    __metadata("design:type", Number)
], Seat.prototype, "hallId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seat_number', length: 10 }),
    __metadata("design:type", String)
], Seat.prototype, "seatNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seat_type', type: 'enum', enum: SeatType, default: SeatType.STANDARD }),
    __metadata("design:type", String)
], Seat.prototype, "seatType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SeatStatus, default: SeatStatus.ACTIVE }),
    __metadata("design:type", String)
], Seat.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cinema_hall_entity_1.CinemaHall, (h) => h.seats, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hall_id' }),
    __metadata("design:type", cinema_hall_entity_1.CinemaHall)
], Seat.prototype, "hall", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ticket_entity_1.Ticket, (t) => t.seat),
    __metadata("design:type", Array)
], Seat.prototype, "tickets", void 0);
exports.Seat = Seat = __decorate([
    (0, typeorm_1.Entity)('Seats')
], Seat);
//# sourceMappingURL=seat.entity.js.map