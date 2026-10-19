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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../../common/jwt-auth.guard");
const roles_guard_1 = require("../../common/roles.guard");
const roles_decorator_1 = require("../../common/roles.decorator");
const user_entity_1 = require("../users/user.entity");
let AdminController = class AdminController {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async summary(from, to) {
        const range = this.rangeParams(from, to);
        const [revenue, ticketsSold, bookings, customers] = await Promise.all([
            this.dataSource.query(`SELECT COALESCE(SUM(total_amount),0) AS revenue FROM Bookings
         WHERE status='PAID' AND booking_date BETWEEN ? AND ?`, range),
            this.dataSource.query(`SELECT COUNT(*) AS cnt FROM Tickets t
         JOIN Bookings b ON b.booking_id = t.booking_id
         WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?`, range),
            this.dataSource.query(`SELECT COUNT(*) AS cnt FROM Bookings WHERE booking_date BETWEEN ? AND ?`, range),
            this.dataSource.query(`SELECT COUNT(*) AS cnt FROM Users WHERE role='CUSTOMER'`),
        ]);
        return {
            totalRevenue: Number(revenue[0]?.revenue || 0),
            ticketsSold: Number(ticketsSold[0]?.cnt || 0),
            totalBookings: Number(bookings[0]?.cnt || 0),
            totalCustomers: Number(customers[0]?.cnt || 0),
        };
    }
    async revenueByMovie(from, to) {
        const rows = await this.dataSource.query(`SELECT m.movie_id AS movieId, m.title, m.poster_url AS posterUrl,
              COUNT(t.ticket_id) AS ticketsSold,
              COALESCE(SUM(t.price),0) AS revenue
       FROM Tickets t
       JOIN Bookings b  ON b.booking_id = t.booking_id
       JOIN Showtimes s ON s.showtime_id = t.showtime_id
       JOIN Movies m    ON m.movie_id = s.movie_id
       WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?
       GROUP BY m.movie_id, m.title, m.poster_url
       ORDER BY revenue DESC`, this.rangeParams(from, to));
        return rows.map((r) => ({ ...r, revenue: Number(r.revenue), ticketsSold: Number(r.ticketsSold) }));
    }
    async revenueByHall(from, to) {
        const rows = await this.dataSource.query(`SELECT h.hall_id AS hallId, h.hall_name AS hallName, h.hall_type AS hallType,
              COUNT(t.ticket_id) AS ticketsSold,
              COALESCE(SUM(t.price),0) AS revenue
       FROM Tickets t
       JOIN Bookings b  ON b.booking_id = t.booking_id
       JOIN Showtimes s ON s.showtime_id = t.showtime_id
       JOIN CinemaHalls h ON h.hall_id = s.hall_id
       WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?
       GROUP BY h.hall_id, h.hall_name, h.hall_type
       ORDER BY revenue DESC`, this.rangeParams(from, to));
        return rows.map((r) => ({ ...r, revenue: Number(r.revenue), ticketsSold: Number(r.ticketsSold) }));
    }
    async revenueDaily(from, to) {
        const rows = await this.dataSource.query(`SELECT DATE(b.booking_date) AS day,
              COALESCE(SUM(b.total_amount),0) AS revenue,
              COUNT(*) AS bookings
       FROM Bookings b
       WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?
       GROUP BY DATE(b.booking_date)
       ORDER BY day ASC`, this.rangeParams(from, to));
        return rows.map((r) => ({ ...r, revenue: Number(r.revenue), bookings: Number(r.bookings) }));
    }
    rangeParams(from, to) {
        const f = from && !isNaN(Date.parse(from)) ? from : '2000-01-01';
        const t = to && !isNaN(Date.parse(to))
            ? `${to.slice(0, 10)} 23:59:59`
            : '2999-12-31 23:59:59';
        return [f, t];
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('revenue-by-movie'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revenueByMovie", null);
__decorate([
    (0, common_1.Get)('revenue-by-hall'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revenueByHall", null);
__decorate([
    (0, common_1.Get)('revenue-daily'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revenueDaily", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AdminController);
//# sourceMappingURL=admin.controller.js.map