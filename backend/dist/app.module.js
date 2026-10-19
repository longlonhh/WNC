"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const database_module_1 = require("./config/database.module");
const jwt_auth_guard_1 = require("./common/jwt-auth.guard");
const roles_guard_1 = require("./common/roles.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const movies_module_1 = require("./modules/movies/movies.module");
const halls_module_1 = require("./modules/halls/halls.module");
const showtimes_module_1 = require("./modules/showtimes/showtimes.module");
const booking_module_1 = require("./modules/booking/booking.module");
const staff_module_1 = require("./modules/staff/staff.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            movies_module_1.MoviesModule,
            halls_module_1.HallsModule,
            showtimes_module_1.ShowtimesModule,
            booking_module_1.BookingModule,
            staff_module_1.StaffModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            {
                provide: core_1.APP_PIPE,
                useValue: new common_1.ValidationPipe({ whitelist: true, transform: true }),
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map