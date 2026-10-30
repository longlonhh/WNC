"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowtimesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const showtimes_controller_1 = require("./showtimes.controller");
const showtimes_service_1 = require("./showtimes.service");
const showtime_entity_1 = require("./showtime.entity");
const movies_module_1 = require("../movies/movies.module");
let ShowtimesModule = class ShowtimesModule {
};
exports.ShowtimesModule = ShowtimesModule;
exports.ShowtimesModule = ShowtimesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([showtime_entity_1.Showtime]), movies_module_1.MoviesModule],
        controllers: [showtimes_controller_1.ShowtimesController],
        providers: [showtimes_service_1.ShowtimesService],
        exports: [typeorm_1.TypeOrmModule],
    })
], ShowtimesModule);
//# sourceMappingURL=showtimes.module.js.map