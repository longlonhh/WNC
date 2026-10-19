import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

interface LockEntry {
  bookingId: number;
  userId: number;
  expiresAt: number;
}

/**
 * SeatLockService - cơ chế "Khóa tạm thời ghế (Hold Seat)" 5-10 phút.
 * In-memory Map + TTL: khi hết hạn ghế tự động mở khóa.
 * (Có thể thay bằng Redis TTL khi triển khai lớn.)
 */
@Injectable()
export class SeatLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SeatLockService.name);
  private locks = new Map<string, LockEntry>();
  private timer: NodeJS.Timeout;

  /** TTL mặc định 8 phút (tài liệu: 5-10 phút) */
  private readonly TTL_MS = 8 * 60 * 1000;

  onModuleInit() {
    // Scheduler 30s quét dọn lock hết hạn
    this.timer = setInterval(() => this.cleanup(), 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private key(showtimeId: number, seatId: number) {
    return `${showtimeId}:${seatId}`;
  }

  /**
   * Cố gắng khóa 1 ghế. Trả false nếu ghế đã có người đặt/đang giữ.
   */
  tryLock(showtimeId: number, seatId: number, bookingId: number, userId: number): boolean {
    const k = this.key(showtimeId, seatId);
    const existing = this.locks.get(k);
    const now = Date.now();

    // Ghế đang giữ bởi chính đơn này -> gia hạn
    if (existing && existing.bookingId === bookingId) {
      existing.expiresAt = now + this.TTL_MS;
      return true;
    }
    // Ghế đang giữ bởi người khác và chưa hết hạn -> từ chối
    if (existing && existing.expiresAt > now) return false;

    this.locks.set(k, { bookingId, userId, expiresAt: now + this.TTL_MS });
    return true;
  }

  isLocked(showtimeId: number, seatId: number): boolean {
    const entry = this.locks.get(this.key(showtimeId, seatId));
    return !!entry && entry.expiresAt > Date.now();
  }

  lockOwner(showtimeId: number, seatId: number): number | null {
    const entry = this.locks.get(this.key(showtimeId, seatId));
    return entry && entry.expiresAt > Date.now() ? entry.userId : null;
  }

  /** Mở khóa 1 loạt ghế (thanh toán thất bại / hủy đơn) */
  unlock(showtimeId: number, seatIds: number[]) {
    for (const seatId of seatIds) this.locks.delete(this.key(showtimeId, seatId));
  }

  /** Thời gian giữ chỗ còn lại (giây) theo bookingId */
  expiresInSeconds(bookingId: number): number {
    for (const v of this.locks.values()) {
      if (v.bookingId === bookingId) {
        return Math.max(0, Math.floor((v.expiresAt - Date.now()) / 1000));
      }
    }
    return 0;
  }

  private cleanup() {
    const now = Date.now();
    for (const [k, v] of this.locks.entries()) {
      if (v.expiresAt <= now) this.locks.delete(k);
    }
  }
}
