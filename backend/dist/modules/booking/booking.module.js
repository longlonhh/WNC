"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ticket_controller_1 = require("./ticket.controller");
const seats_controller_1 = require("./seats.controller");
const ticket_service_1 = require("./ticket.service");
const seat_lock_service_1 = require("./seat-lock.service");
const booking_timeout_service_1 = require("./booking-timeout.service");
const payment_gateway_service_1 = require("../payments/payment-gateway.service");
const email_service_1 = require("../emails/email.service");
const booking_entity_1 = require("./booking.entity");
const ticket_entity_1 = require("./ticket.entity");
const seat_entity_1 = require("../halls/seat.entity");
const showtime_entity_1 = require("../showtimes/showtime.entity");
const user_entity_1 = require("../users/user.entity");
let BookingModule = class BookingModule {
};
exports.BookingModule = BookingModule;
exports.BookingModule = BookingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([booking_entity_1.Booking, ticket_entity_1.Ticket, seat_entity_1.Seat, showtime_entity_1.Showtime, user_entity_1.User])],
        controllers: [ticket_controller_1.TicketController, seats_controller_1.SeatsStatusController],
        providers: [ticket_service_1.TicketService, seat_lock_service_1.SeatLockService, booking_timeout_service_1.BookingTimeoutService, payment_gateway_service_1.PaymentGatewayService, email_service_1.EmailService],
        exports: [ticket_service_1.TicketService],
    })
], BookingModule);
//# sourceMappingURL=booking.module.js.map