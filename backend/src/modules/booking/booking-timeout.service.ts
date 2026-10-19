import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';

/**
 * Exception Flow 1 - Timeout Exception (Luồng ngoại lệ):
 * Khách không hoàn tất thanh toán trong thời gian giữ ghế
 *   -> Scheduler tự động hủy đơn PENDING và nhả ghế về trạng thái trống.
 *
 * Tần suất quét: mỗi 30 giây. Đơn PENDING "quá hạn" = tạo trước hôm nay - 10 phút
 * (TTL giữ ghế 8 phút + buffer 2 phút). Việc xóa Booking sẽ xóa luôn Tickets
 * nhờ ràng buộc FK ... ON DELETE CASCADE -> ghế tự do cho người khác đặt.
 */
@Injectable()
export class BookingTimeoutService {
  private readonly logger = new Logger(BookingTimeoutService.name);

  /** TTL giữ ghế 8' + buffer 2' = 10 phút (tài liệu: 5-10 phút) */
  private static readonly CUTOFF_MS = 10 * 60 * 1000;

  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
  ) {}

  @Interval(30_000)
  async cleanupExpiredBookings(): Promise<void> {
    const cutoff = new Date(Date.now() - BookingTimeoutService.CUTOFF_MS);
    const stale = await this.bookingRepo.find({
      where: { status: BookingStatus.PENDING, bookingDate: LessThan(cutoff) },
    });
    for (const booking of stale) {
      await this.bookingRepo.delete(booking.bookingId);
      this.logger.log(
        `Đơn PENDING #${booking.bookingId} quá hạn giữ ghế -> tự động hủy, ghế về trạng thái trống`,
      );
    }
  }
}
