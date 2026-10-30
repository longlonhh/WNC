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
exports.TicketController = void 0;
const common_1 = require("@nestjs/common");
const ticket_service_1 = require("./ticket.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const jwt_auth_guard_1 = require("../../common/jwt-auth.guard");
const roles_guard_1 = require("../../common/roles.guard");
let TicketController = class TicketController {
    constructor(ticketService) {
        this.ticketService = ticketService;
    }
    createBooking(req, dto) {
        return this.ticketService.createBooking(req.user.userId, dto);
    }
    createPaymentRequest(req, id, body) {
        return this.ticketService.createPaymentRequest(req.user.userId, id, body.method);
    }
    paymentCallback(req, id, body) {
        return this.ticketService.handlePaymentCallback(req.user.userId, id, body.success, body.transactionId);
    }
    findMyBookings(req) {
        return this.ticketService.findMyBookings(req.user.userId);
    }
    findOne(req, id) {
        return this.ticketService.findOneForUser(req.user.userId, req.user.role, id);
    }
};
exports.TicketController = TicketController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], TicketController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Post)(':id/payment-request'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], TicketController.prototype, "createPaymentRequest", null);
__decorate([
    (0, common_1.Post)(':id/payment-callback'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], TicketController.prototype, "paymentCallback", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TicketController.prototype, "findMyBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], TicketController.prototype, "findOne", null);
exports.TicketController = TicketController = __decorate([
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ticket_service_1.TicketService])
], TicketController);
//# sourceMappingURL=ticket.controller.js.map