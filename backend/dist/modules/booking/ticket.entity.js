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
exports.Ticket = void 0;
const typeorm_1 = require("typeorm");
const booking_entity_1 = require("./booking.entity");
const showtime_entity_1 = require("../showtimes/showtime.entity");
const seat_entity_1 = require("../halls/seat.entity");
let Ticket = class Ticket {
};
exports.Ticket = Ticket;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'ticket_id' }),
    __metadata("design:type", Number)
], Ticket.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_id' }),
    __metadata("design:type", Number)
], Ticket.prototype, "bookingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'showtime_id' }),
    __metadata("design:type", Number)
], Ticket.prototype, "showtimeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seat_id' }),
    __metadata("design:type", Number)
], Ticket.prototype, "seatId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Ticket.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_code', length: 50, nullable: true, unique: true }),
    __metadata("design:type", String)
], Ticket.prototype, "ticketCode", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => booking_entity_1.Booking, (b) => b.tickets, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'booking_id' }),
    __metadata("design:type", booking_entity_1.Booking)
], Ticket.prototype, "booking", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => showtime_entity_1.Showtime, (t) => t.tickets, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'showtime_id' }),
    __metadata("design:type", showtime_entity_1.Showtime)
], Ticket.prototype, "showtime", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => seat_entity_1.Seat, (s) => s.tickets, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'seat_id' }),
    __metadata("design:type", seat_entity_1.Seat)
], Ticket.prototype, "seat", void 0);
exports.Ticket = Ticket = __decorate([
    (0, typeorm_1.Entity)('Tickets')
], Ticket);
//# sourceMappingURL=ticket.entity.js.map