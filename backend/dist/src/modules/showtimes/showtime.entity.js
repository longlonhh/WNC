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
exports.Showtime = void 0;
const typeorm_1 = require("typeorm");
const movie_entity_1 = require("../movies/movie.entity");
const cinema_hall_entity_1 = require("../halls/cinema-hall.entity");
const ticket_entity_1 = require("../booking/ticket.entity");
let Showtime = class Showtime {
};
exports.Showtime = Showtime;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'showtime_id' }),
    __metadata("design:type", Number)
], Showtime.prototype, "showtimeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'movie_id' }),
    __metadata("design:type", Number)
], Showtime.prototype, "movieId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hall_id' }),
    __metadata("design:type", Number)
], Showtime.prototype, "hallId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_time', type: 'datetime' }),
    __metadata("design:type", Date)
], Showtime.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_time', type: 'datetime' }),
    __metadata("design:type", Date)
], Showtime.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_price', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Showtime.prototype, "ticketPrice", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => movie_entity_1.Movie, (m) => m.showtimes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'movie_id' }),
    __metadata("design:type", movie_entity_1.Movie)
], Showtime.prototype, "movie", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cinema_hall_entity_1.CinemaHall, (h) => h.showtimes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hall_id' }),
    __metadata("design:type", cinema_hall_entity_1.CinemaHall)
], Showtime.prototype, "hall", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ticket_entity_1.Ticket, (t) => t.showtime),
    __metadata("design:type", Array)
], Showtime.prototype, "tickets", void 0);
exports.Showtime = Showtime = __decorate([
    (0, typeorm_1.Entity)('Showtimes')
], Showtime);
//# sourceMappingURL=showtime.entity.js.map