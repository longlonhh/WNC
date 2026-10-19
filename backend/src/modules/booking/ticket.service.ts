import {
  Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import * as QRCode from 'qrcode';
import { Booking, BookingStatus } from './booking.entity';
import { Ticket } from './ticket.entity';
import { Seat, SeatType } from '../halls/seat.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { User } from '../users/user.entity';
import { SeatLockService } from './seat-lock.service';
import { PaymentGatewayService } from '../payments/payment-gateway.service';
import { EmailService } from '../emails/email.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * TicketService - Chứa toàn bộ Business Logic:
 *   khóa ghế tạm thời, tính tổng tiền, tạo đơn đặt, cập nhật trạng thái,
 *   sinh vé điện tử QR, gọi email xác nhận.
 */
@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  /** Hệ số giá theo loại ghế: Thường x1, VIP x1.5, Couple x2 (double seat) */
  private readonly SEAT_PRICE_FACTOR: Record<SeatType, number> = {
    [SeatType.STANDARD]: 1,
    [SeatType.VIP]: 1.5,
    [SeatType.COUPLE]: 2,
  };

  constructor(
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Seat) private readonly seatRepo: Repository<Seat>,
    @InjectRepository(Showtime) private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly seatLock: SeatLockService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * GIAI ĐOẠN 1+2: Kiểm tra & khóa ghế tạm thời + Tính tiền
   * - Giao diện gửi: KtraTrangThaiGhe(maXuatChieu, danhSachGhe)
   * - QueryTrangThaiGhe: ghế ĐÃ BÁN (đã có Ticket) hoặc ĐANG GIỮ (seat lock)
   * - Alt [Ghế đã có người đặt] -> lỗi "Ghế đã được chọn"
   * - Alt [Ghế còn trống]       -> Hold Seat 5-10' + TinhTongTien(danhSachGhe, loaiVe)
   */
  async createBooking(userId: number, dto: CreateBookingDto) {
    const showtime = await this.showtimeRepo.findOne({
      where: { showtimeId: dto.showtimeId },
      relations: ['movie', 'hall'],
    });
    if (!showtime) throw new NotFoundException('Không tìm thấy suất chiếu');
    if (showtime.startTime <= new Date()) {
      throw new BadRequestException('Suất chiếu đã bắt đầu hoặc đã kết thúc');
    }

    const seatIds = dto.seats.map((s) => s.seatId);

    // Lấy ghế theo danh sách ID + kiểm tra ghế thuộc đúng phòng của suất chiếu
    const seats = await this.seatRepo.findBy({ seatId: In(seatIds) });
    if (seats.length !== seatIds.length) throw new BadRequestException('Có ghế không tồn tại');
    if (seats.some((s) => s.hallId !== showtime.hallId)) {
      throw new BadRequestException('Ghế không thuộc phòng chiếu của suất này');
    }

    // Ghế ĐÃ BÁN = đã có Ticket thuộc đơn PAID của suất chiếu này
    // (Ticket của đơn PENDING chỉ là "đang giữ" -> chặn qua Seat Lock, không chặn vĩnh viễn)
    const soldTickets = await this.ticketRepo
      .createQueryBuilder('t')
      .innerJoin('t.booking', 'b')
      .where('t.showtimeId = :showtimeId', { showtimeId: dto.showtimeId })
      .andWhere('b.status = :status', { status: BookingStatus.PAID })
      .andWhere('t.seatId IN (:...seatIds)', { seatIds })
      .getMany();
    if (soldTickets.length > 0) {
      const sold = seats.filter((s) => soldTickets.some((t) => t.seatId === s.seatId));
      throw new BadRequestException(
        `Ghế đã được chọn: ${sold.map((s) => s.seatNumber).join(', ')}. Vui lòng chọn vị trí khác.`,
      );
    }

    // Tạo booking PENDING trước để có bookingId phục vụ khóa ghế
    let booking = await this.bookingRepo.save(
      this.bookingRepo.create({ userId, status: BookingStatus.PENDING, totalAmount: 0 }),
    );

    // Hold Seat: khóa từng ghế; nếu vướng ghế đang giữ bởi đơn khác -> mở khóa + xóa đơn nháp
    const lockedSeatIds: number[] = [];
    for (const seat of seats) {
      const ok = this.seatLock.tryLock(dto.showtimeId, seat.seatId, booking.bookingId, userId);
      if (!ok) {
        this.seatLock.unlock(dto.showtimeId, lockedSeatIds);
        await this.bookingRepo.delete(booking.bookingId);
        throw new BadRequestException(
          `Ghế ${seat.seatNumber} đang được giữ tạm thời bởi người khác. Vui lòng chọn vị trí khác.`,
        );
      }
      lockedSeatIds.push(seat.seatId);
    }

    // TinhTongTien(danhSachGhe, loaiVe) = đơn giá suất chiếu x hệ số loại ghế
    const totalAmount = seats.reduce(
      (sum, seat) => sum + Number(showtime.ticketPrice) * this.SEAT_PRICE_FACTOR[seat.seatType],
      0,
    );

    booking.totalAmount = totalAmount;
    booking = await this.bookingRepo.save(booking);

    // Tạo tickets tạm (ticketCode chỉ cấp khi thanh toán thành công)
    // UNIQUE (showtime_id, seat_id) ở DB là rào chắn cuối chống Race Condition
    let tickets: Ticket[];
    try {
      tickets = await this.ticketRepo.save(
        seats.map((seat) =>
          this.ticketRepo.create({
            bookingId: booking.bookingId,
            showtimeId: dto.showtimeId,
            seatId: seat.seatId,
            price: Number(showtime.ticketPrice) * this.SEAT_PRICE_FACTOR[seat.seatType],
          }),
        ),
      );
    } catch (e) {
      // 2 người bấm đặt cùng 1 ghế -> ràng buộc duy nhất từ chối ngay lập tức
      this.seatLock.unlock(dto.showtimeId, lockedSeatIds);
      await this.bookingRepo.delete(booking.bookingId);
      throw new BadRequestException('Ghế vừa được người khác chọn. Vui lòng chọn vị trí khác.');
    }

    return {
      bookingId: booking.bookingId,
      status: booking.status,
      totalAmount,
      holdExpiresInSeconds: this.seatLock.expiresInSeconds(booking.bookingId),
      movie: {
        movieId: showtime.movie.movieId,
        title: showtime.movie.title,
        posterUrl: showtime.movie.posterUrl,
      },
      showtime: {
        showtimeId: showtime.showtimeId,
        startTime: showtime.startTime,
        hallName: showtime.hall.hallName,
      },
      seats: seats.map((s) => ({
        seatId: s.seatId,
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        price: Number(showtime.ticketPrice) * this.SEAT_PRICE_FACTOR[s.seatType],
        ticketId: tickets.find((t) => t.seatId === s.seatId)?.ticketId,
      })),
    };
  }

  /**
   * GIAI ĐOẠN 3: Khởi tạo yêu cầu thanh toán
   * TaoYeuCauThanhToan(maDonHang, tongTien) -> PaymentGateway.YeuCauThanhToan(thongTinGiaoDich)
   */
  async createPaymentRequest(userId: number, bookingId: number, method: 'VNPAY' | 'MOMO') {
    const booking = await this.getOwnedPendingBooking(userId, bookingId);
    const user = await this.userRepo.findOneBy({ userId });

    const payReq = await this.paymentGateway.createPaymentRequest({
      bookingId: booking.bookingId,
      amount: Number(booking.totalAmount),
      method,
      customerEmail: user?.email,
    });

    return {
      bookingId: booking.bookingId,
      method: payReq.method,
      amount: payReq.amount,
      paymentUrl: payReq.paymentUrl,
      qrDataUrl: payReq.qrDataUrl,
      transactionId: payReq.transactionId,
      holdExpiresInSeconds: this.seatLock.expiresInSeconds(booking.bookingId),
    };
  }

  /**
   * GIAI ĐOẠN 4+5: Xử lý kết quả thanh toán (Callback)
   * Alt [Thất bại]: BaoGiaoDichThatBai -> Un-lock ghế -> báo lỗi
   * Alt [Thành công]: XacNhanThanhToanThanhCong -> CapNhatTrangThaiGhe("Đã bán")
   *            -> LuuThongTinVe -> TaoVeDienTu(QR) -> GuiEmailXacNhan -> trả kết quả
   */
  async handlePaymentCallback(userId: number, bookingId: number, success: boolean, transactionId?: string) {
    const booking = await this.getOwnedBooking(userId, bookingId);

    const tickets = await this.ticketRepo.find({
      where: { bookingId },
      relations: ['seat', 'showtime', 'showtime.movie', 'showtime.hall'],
    });
    if (tickets.length === 0) throw new BadRequestException('Đơn hàng không có vé nào');
    const showtimeId = tickets[0].showtimeId;

    // ===== Idempotency Control (Exception Flow 3): =====
    // Callback có thể bị cổng thanh toán gửi lặp lại -> không xử lý lần 2,
    // trả về đúng kết quả như lần xử lý đầu tiên.
    if (booking.status === BookingStatus.PAID) {
      const emailTickets = await Promise.all(
        tickets.map(async (t) => ({
          ticketCode: t.ticketCode,
          seatNumber: t.seat.seatNumber,
          price: Number(t.price),
          qrDataUrl: await QRCode.toDataURL(t.ticketCode, { width: 240 }),
        })),
      );
      return {
        message: 'Đơn hàng này đã được thanh toán trước đó (callback lặp được bỏ qua - idempotent).',
        bookingId: booking.bookingId,
        status: booking.status,
        totalAmount: Number(booking.totalAmount),
        tickets: emailTickets,
      };
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng đã bị hủy. Vui lòng đặt vé mới.');
    }

    // ===== ALT: THANH TOÁN THẤT BẠI =====
    if (!success) {
      // Un-lock (Mở khóa) lại ghế để người khác có thể đặt
      this.seatLock.unlock(showtimeId, tickets.map((t) => t.seatId));
      await this.bookingRepo.delete(bookingId); // xóa đơn nháp
      throw new BadRequestException('Thanh toán thất bại. Ghế đã được mở khóa, mời bạn chọn lại.');
    }

    // ===== THANH TOÁN THÀNH CÔNG =====
    // Kiểm tra an toàn: ghế chưa bị đơn KHÁC thanh toán trong lúc giữ
    const soldByOther = await this.ticketRepo
      .createQueryBuilder('t')
      .innerJoin('t.booking', 'b')
      .where('t.showtimeId = :stId', { stId: showtimeId })
      .andWhere('t.seatId IN (:...seatIds)', { seatIds: tickets.map((t) => t.seatId) })
      .andWhere('b.status = :status', { status: BookingStatus.PAID })
      .andWhere('b.bookingId != :bookingId', { bookingId })
      .getCount();
    if (soldByOther > 0) {
      this.seatLock.unlock(showtimeId, tickets.map((t) => t.seatId));
      await this.bookingRepo.delete(bookingId);
      throw new ConflictException('Có ghế vừa được người khác thanh toán. Vui lòng chọn lại.');
    }

    const user = await this.userRepo.findOneBy({ userId });

    // 13b. CapNhatTrangThaiGhe("Đã bán") + cập nhật trạng thái đơn
    booking.status = BookingStatus.PAID;
    booking.paymentQrCode = transactionId || `TX${Date.now()}`;
    await this.bookingRepo.save(booking);

    // 14b. LuuThongTinVe + 15b. TaoVeDienTu: sinh ticketCode + ảnh QR
    const emailTickets: Array<{
      ticketCode: string; seatNumber: string; price: number; qrDataUrl: string;
    }> = [];
    for (const t of tickets) {
      t.ticketCode = this.generateTicketCode(booking.bookingId, t.ticketId);
      await this.ticketRepo.save(t);
      const qrDataUrl = await QRCode.toDataURL(t.ticketCode, { width: 240 });
      emailTickets.push({
        ticketCode: t.ticketCode,
        seatNumber: t.seat.seatNumber,
        price: Number(t.price),
        qrDataUrl,
      });
    }

    // 16b. GuiEmailXacNhan(emailKhachHang, veDienTu)
    const st = tickets[0].showtime;
    try {
      await this.emailService.sendTicketEmail(
        user?.email || 'unknown@localhost',
        user?.fullName || 'Khách hàng',
        {
          bookingId: booking.bookingId,
          movieTitle: st.movie.title,
          startTime: st.startTime,
          hallName: st.hall.hallName,
          seats: emailTickets.map((t) => t.seatNumber).join(', '),
          totalAmount: Number(booking.totalAmount),
          tickets: emailTickets,
        },
      );
    } catch (e) {
      // Gửi mail thất bại không làm hỏng giao dịch đặt vé
      this.logger.error('Gửi email xác nhận thất bại', e as Error);
    }

    return {
      message: 'Đặt vé thành công! Vé điện tử đã được gửi tới email của bạn.',
      bookingId: booking.bookingId,
      status: booking.status,
      totalAmount: Number(booking.totalAmount),
      tickets: emailTickets,
    };
  }

  /** Lịch sử giao dịch của khách hàng */
  async findMyBookings(userId: number) {
    return this.bookingRepo.find({
      where: { userId },
      relations: ['tickets', 'tickets.seat', 'tickets.showtime', 'tickets.showtime.movie'],
      order: { bookingDate: 'DESC' },
    });
  }

  /** Chi tiết đơn (chủ đơn hoặc ADMIN/STAFF) */
  async findOneForUser(userId: number, role: string, bookingId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { bookingId },
      relations: [
        'tickets', 'tickets.seat',
        'tickets.showtime', 'tickets.showtime.movie', 'tickets.showtime.hall',
        'user',
      ],
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (booking.userId !== userId && role !== 'ADMIN' && role !== 'STAFF') {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }
    return booking;
  }

  /** Soát vé: xác thực + chuyển trạng thái "Đã check-in / Đã soát" */
  async checkinTicket(ticketCode: string, staffId: number) {
    const cleanCode = String(ticketCode || '').trim();
    if (!cleanCode) throw new BadRequestException('Vui lòng nhập mã vé');
    if (cleanCode.endsWith('-USED')) throw new BadRequestException('Vé đã được soát trước đó');

    const ticket = await this.ticketRepo.findOne({
      where: { ticketCode: cleanCode },
      relations: ['booking', 'showtime', 'showtime.movie', 'showtime.hall', 'seat'],
    });

    // Quét lại cùng 1 mã vé (nay là ...-USED trong DB) -> báo "đã soát trước đó"
    if (!ticket) {
      const alreadyUsed = await this.ticketRepo.findOneBy({ ticketCode: `${cleanCode}-USED` });
      if (alreadyUsed) throw new BadRequestException('Vé đã được soát trước đó');
    }
    if (!ticket) throw new NotFoundException('Vé không tồn tại hoặc mã không hợp lệ');

    if (ticket.booking.status !== BookingStatus.PAID) {
      throw new BadRequestException('Vé chưa được thanh toán');
    }

    // Chuyển trạng thái vé sang "Đã check-in"
    ticket.ticketCode = `${cleanCode}-USED`;
    await this.ticketRepo.save(ticket);

    return {
      message: 'Check-in thành công',
      ticket: {
        ticketCode: ticket.ticketCode,
        seatNumber: ticket.seat.seatNumber,
        seatType: ticket.seat.seatType,
        movieTitle: ticket.showtime.movie.title,
        startTime: ticket.showtime.startTime,
        hallName: ticket.showtime.hall.hallName,
      },
      checkedBy: staffId,
      checkedAt: new Date(),
    };
  }

  /**
   * Trạng thái ghế real-time cho sơ đồ phòng chiếu:
   *   FREE (trống) / HELD (đang giữ) / SOLD (đã bán)
   */
  async getSeatStatus(showtimeId: number) {
    const showtime = await this.showtimeRepo.findOneBy({ showtimeId });
    if (!showtime) throw new NotFoundException('Không tìm thấy suất chiếu');

    const hallSeats = await this.seatRepo.find({
      where: { hallId: showtime.hallId },
      order: { seatNumber: 'ASC' },
    });
    const showtimeTickets = await this.ticketRepo.find({
      where: { showtimeId },
      relations: ['booking'],
    });

    return hallSeats.map((seat) => {
      const mine = showtimeTickets.filter((t) => t.seatId === seat.seatId);
      const sold = mine.some((t) => t.booking.status === BookingStatus.PAID);
      const pending = mine.some((t) => t.booking.status === BookingStatus.PENDING);
      // HELD = có Ticket của đơn PENDING (đang trong thời gian giữ/đang thanh toán)
      const held = pending || (!sold && this.seatLock.isLocked(showtimeId, seat.seatId));
      return {
        seatId: seat.seatId,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status: sold ? 'SOLD' : held ? 'HELD' : 'FREE',
        price: Number(showtime.ticketPrice) * this.SEAT_PRICE_FACTOR[seat.seatType],
      };
    });
  }

  // ===== helpers =====

  /** Đơn tồn tại + đúng chủ sở hữu (dùng cho callback thanh toán) */
  private async getOwnedBooking(userId: number, bookingId: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOneBy({ bookingId });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (booking.userId !== userId) throw new ForbiddenException('Không phải đơn hàng của bạn');
    return booking;
  }

  private async getOwnedPendingBooking(userId: number, bookingId: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOneBy({ bookingId });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (booking.userId !== userId) throw new ForbiddenException('Không phải đơn hàng của bạn');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');
    }
    return booking;
  }

  private generateTicketCode(bookingId: number, ticketId: number): string {
    const stamp = Date.now().toString(36).toUpperCase();
    return `CPX-${String(bookingId).padStart(4, '0')}-${String(ticketId).padStart(3, '0')}-${stamp}`;
  }
}
