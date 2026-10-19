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
exports.ShowtimesController = void 0;
const common_1 = require("@nestjs/common");
const showtimes_service_1 = require("./showtimes.service");
const create_showtime_dto_1 = require("./dto/create-showtime.dto");
const jwt_auth_guard_1 = require("../../common/jwt-auth.guard");
const roles_guard_1 = require("../../common/roles.guard");
const roles_decorator_1 = require("../../common/roles.decorator");
const public_decorator_1 = require("../../common/public.decorator");
const user_entity_1 = require("../users/user.entity");
let ShowtimesController = class ShowtimesController {
    constructor(showtimesService) {
        this.showtimesService = showtimesService;
    }
    findAll(movieId, date) {
        return this.showtimesService.findAll(movieId ? +movieId : undefined, date);
    }
    findOne(id) {
        return this.showtimesService.findOne(id);
    }
    create(dto) {
        return this.showtimesService.create(dto);
    }
    update(id, dto) {
        return this.showtimesService.update(id, dto);
    }
    remove(id) {
        return this.showtimesService.remove(id);
    }
};
exports.ShowtimesController = ShowtimesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('movieId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ShowtimesController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ShowtimesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_showtime_dto_1.CreateShowtimeDto]),
    __metadata("design:returntype", void 0)
], ShowtimesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ShowtimesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ShowtimesController.prototype, "remove", null);
exports.ShowtimesController = ShowtimesController = __decorate([
    (0, common_1.Controller)('showtimes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [showtimes_service_1.ShowtimesService])
], ShowtimesController);
//# sourceMappingURL=showtimes.controller.js.map