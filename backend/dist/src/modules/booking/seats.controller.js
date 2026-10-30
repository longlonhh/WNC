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
exports.SeatsStatusController = void 0;
const common_1 = require("@nestjs/common");
const ticket_service_1 = require("./ticket.service");
const public_decorator_1 = require("../../common/public.decorator");
let SeatsStatusController = class SeatsStatusController {
    constructor(ticketService) {
        this.ticketService = ticketService;
    }
    getSeatStatus(showtimeId) {
        return this.ticketService.getSeatStatus(showtimeId);
    }
};
exports.SeatsStatusController = SeatsStatusController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/seats-status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SeatsStatusController.prototype, "getSeatStatus", null);
exports.SeatsStatusController = SeatsStatusController = __decorate([
    (0, common_1.Controller)('showtimes'),
    __metadata("design:paramtypes", [ticket_service_1.TicketService])
], SeatsStatusController);
//# sourceMappingURL=seats.controller.js.map