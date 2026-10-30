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
exports.HallsController = void 0;
const common_1 = require("@nestjs/common");
const halls_service_1 = require("./halls.service");
const create_hall_dto_1 = require("./dto/create-hall.dto");
const generate_seats_dto_1 = require("./dto/generate-seats.dto");
const jwt_auth_guard_1 = require("../../common/jwt-auth.guard");
const roles_guard_1 = require("../../common/roles.guard");
const roles_decorator_1 = require("../../common/roles.decorator");
const public_decorator_1 = require("../../common/public.decorator");
const user_entity_1 = require("../users/user.entity");
let HallsController = class HallsController {
    constructor(hallsService) {
        this.hallsService = hallsService;
    }
    findAll() {
        return this.hallsService.findAll();
    }
    findOne(id) {
        return this.hallsService.findOne(id);
    }
    getSeats(id) {
        return this.hallsService.getSeats(id);
    }
    create(dto) {
        return this.hallsService.create(dto);
    }
    generateSeats(id, dto) {
        return this.hallsService.generateSeats(id, dto);
    }
    update(id, dto) {
        return this.hallsService.update(id, dto);
    }
    remove(id) {
        return this.hallsService.remove(id);
    }
};
exports.HallsController = HallsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "findOne", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/seats'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "getSeats", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hall_dto_1.CreateHallDto]),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Post)(':id/seats/generate'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, generate_seats_dto_1.GenerateSeatsDto]),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "generateSeats", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HallsController.prototype, "remove", null);
exports.HallsController = HallsController = __decorate([
    (0, common_1.Controller)('halls'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [halls_service_1.HallsService])
], HallsController);
//# sourceMappingURL=halls.controller.js.map