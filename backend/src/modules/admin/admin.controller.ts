import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '../users/user.entity';

/**
 * Thống kê & Báo cáo (Analytics)
 * "Thống kê tổng doanh thu theo khoảng thời gian, theo từng bộ phim hoặc theo
 *  phòng chiếu; hiển thị qua biểu đồ trực quan."
 */
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** GET /admin/stats/summary?from=2026-09-01&to=2026-09-30 */
  @Get('summary')
  async summary(@Query('from') from?: string, @Query('to') to?: string) {
    const range = this.rangeParams(from, to);

    const [revenue, ticketsSold, bookings, customers] = await Promise.all([
      this.dataSource.query(
        `SELECT COALESCE(SUM(total_amount),0) AS revenue FROM Bookings
         WHERE status='PAID' AND booking_date BETWEEN ? AND ?`,
        range,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM Tickets t
         JOIN Bookings b ON b.booking_id = t.booking_id
         WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?`,
        range,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM Bookings WHERE booking_date BETWEEN ? AND ?`,
        range,
      ),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM Users WHERE role='CUSTOMER'`),
    ]);

    return {
      totalRevenue: Number(revenue[0]?.revenue || 0),
      ticketsSold: Number(ticketsSold[0]?.cnt || 0),
      totalBookings: Number(bookings[0]?.cnt || 0),
      totalCustomers: Number(customers[0]?.cnt || 0),
    };
  }

  /** GET /admin/stats/revenue-by-movie?from&to -> dữ liệu biểu đồ doanh thu theo phim */
  @Get('revenue-by-movie')
  async revenueByMovie(@Query('from') from?: string, @Query('to') to?: string) {
    const rows = await this.dataSource.query(
      `SELECT m.movie_id AS movieId, m.title, m.poster_url AS posterUrl,
              COUNT(t.ticket_id) AS ticketsSold,
              COALESCE(SUM(t.price),0) AS revenue
       FROM Tickets t
       JOIN Bookings b  ON b.booking_id = t.booking_id
       JOIN Showtimes s ON s.showtime_id = t.showtime_id
       JOIN Movies m    ON m.movie_id = s.movie_id
       WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?
       GROUP BY m.movie_id, m.title, m.poster_url
       ORDER BY revenue DESC`,
      this.rangeParams(from, to),
    );
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue), ticketsSold: Number(r.ticketsSold) }));
  }

  /** GET /admin/stats/revenue-by-hall?from&to */
  @Get('revenue-by-hall')
  async revenueByHall(@Query('from') from?: string, @Query('to') to?: string) {
    const rows = await this.dataSource.query(
      `SELECT h.hall_id AS hallId, h.hall_name AS hallName, h.hall_type AS hallType,
              COUNT(t.ticket_id) AS ticketsSold,
              COALESCE(SUM(t.price),0) AS revenue
       FROM Tickets t
       JOIN Bookings b  ON b.booking_id = t.booking_id
       JOIN Showtimes s ON s.showtime_id = t.showtime_id
       JOIN CinemaHalls h ON h.hall_id = s.hall_id
       WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?
       GROUP BY h.hall_id, h.hall_name, h.hall_type
       ORDER BY revenue DESC`,
      this.rangeParams(from, to),
    );
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue), ticketsSold: Number(r.ticketsSold) }));
  }

  /** GET /admin/stats/revenue-daily?from&to -> doanh thu theo ngày (biểu đồ đường/cột) */
  @Get('revenue-daily')
  async revenueDaily(@Query('from') from?: string, @Query('to') to?: string) {
    const rows = await this.dataSource.query(
      `SELECT DATE(b.booking_date) AS day,
              COALESCE(SUM(b.total_amount),0) AS revenue,
              COUNT(*) AS bookings
       FROM Bookings b
       WHERE b.status='PAID' AND b.booking_date BETWEEN ? AND ?
       GROUP BY DATE(b.booking_date)
       ORDER BY day ASC`,
      this.rangeParams(from, to),
    );
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue), bookings: Number(r.bookings) }));
  }

  private rangeParams(from?: string, to?: string): [string, string] {
    const f = from && !isNaN(Date.parse(from)) ? from : '2000-01-01';
    const t = to && !isNaN(Date.parse(to))
      ? `${to.slice(0, 10)} 23:59:59`
      : '2999-12-31 23:59:59';
    return [f, t];
  }
}
