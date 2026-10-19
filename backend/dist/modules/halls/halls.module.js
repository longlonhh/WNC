"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const halls_controller_1 = require("./halls.controller");
const halls_service_1 = require("./halls.service");
const cinema_hall_entity_1 = require("./cinema-hall.entity");
const seat_entity_1 = require("./seat.entity");
let HallsModule = class HallsModule {
};
exports.HallsModule = HallsModule;
exports.HallsModule = HallsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([cinema_hall_entity_1.CinemaHall, seat_entity_1.Seat])],
        controllers: [halls_controller_1.HallsController],
        providers: [halls_service_1.HallsService],
        exports: [typeorm_1.TypeOrmModule],
    })
], HallsModule);
//# sourceMappingURL=halls.module.js.map