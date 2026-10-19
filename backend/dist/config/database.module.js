"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../modules/users/user.entity");
const movie_entity_1 = require("../modules/movies/movie.entity");
const cinema_hall_entity_1 = require("../modules/halls/cinema-hall.entity");
const seat_entity_1 = require("../modules/halls/seat.entity");
const showtime_entity_1 = require("../modules/showtimes/showtime.entity");
const booking_entity_1 = require("../modules/booking/booking.entity");
const ticket_entity_1 = require("../modules/booking/ticket.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
                    type: 'mysql',
                    host: process.env.DB_HOST || 'localhost',
                    port: Number(process.env.DB_PORT || 3306),
                    username: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_NAME || 'cinema_booking_db',
                    entities: [user_entity_1.User, movie_entity_1.Movie, cinema_hall_entity_1.CinemaHall, seat_entity_1.Seat, showtime_entity_1.Showtime, booking_entity_1.Booking, ticket_entity_1.Ticket],
                    synchronize: false,
                    logging: false,
                    charset: 'utf8mb4_unicode_ci',
                }),
            }),
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map