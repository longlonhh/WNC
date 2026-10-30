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
var TicketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const QRCode = require("qrcode");
const booking_entity_1 = require("./booking.entity");
const ticket_entity_1 = require("./ticket.entity");
const seat_entity_1 = require("../halls/seat.entity");
const showtime_entity_1 = require("../showtimes/showtime.entity");
const user_entity_1 = require("../users/user.entity");
const seat_lock_service_1 = require("./seat-lock.service");
const payment_gateway_service_1 = require("../payments/payment-gateway.service");
const email_service_1 = require("../emails/email.service");
let TicketService = TicketService_1 = class TicketService {
    constructor(ticketRepo, bookingRepo, seatRepo, showtimeRepo, userRepo, seatLock, paymentGateway, emailService) {
        this.ticketRepo = ticketRepo;
        this.bookingRepo = bookingRepo;
        this.seatRepo = seatRepo;
        this.showtimeRepo = showtimeRepo;
        this.userRepo = userRepo;
        this.seatLock = seatLock;
        this.paymentGateway = paymentGateway;
        this.emailService = emailService;
        this.logger = new common_1.Logger(TicketService_1.name);
        this.SEAT_PRICE_FACTOR = {
            [seat_entity_1.SeatType.STANDARD]: 1,
            [seat_entity_1.SeatType.VIP]: 1.5,
            [seat_entity_1.SeatType.COUPLE]: 2,
        };
    }
    async createBooking(userId, dto) {
        const showtime = await this.showtimeRepo.findOne({
            where: { showtimeId: dto.showtimeId },
            relations: ['movie', 'hall'],
        });
        if (!showtime)
            throw new common_1.NotFoundException('Không tìm thấy suất chiếu');
        if (showtime.startTime <= new Date()) {
            throw new common_1.BadRequestException('Suất chiếu đã bắt đầu hoặc đã kết thúc');
        }
        const seatIds = dto.seats.map((s) => s.seatId);
        const seats = await this.seatRepo.findBy({ seatId: (0, typeorm_2.In)(seatIds) });
        if (seats.length !== seatIds.length)
            throw new common_1.BadRequestException('Có ghế không tồn tại');
        if (seats.some((s) => s.hallId !== showtime.hallId)) {
            throw new common_1.BadRequestException('Ghế không thuộc phòng chiếu của suất này');
        }
        const soldTickets = await this.ticketRepo
            .createQueryBuilder('t')
            .innerJoin('t.booking', 'b')
            .where('t.showtimeId = :showtimeId', { showtimeId: dto.showtimeId })
            .andWhere('b.status = :status', { status: booking_entity_1.BookingStatus.PAID })
            .andWhere('t.seatId IN (:...seatIds)', { seatIds })
            .getMany();
        if (soldTickets.length > 0) {
            const sold = seats.filter((s) => soldTickets.some((t) => t.seatId === s.seatId));
            throw new common_1.BadRequestException(`Ghế đã được chọn: ${sold.map((s) => s.seatNumber).join(', ')}. Vui lòng chọn vị trí khác.`);
        }
        let booking = await this.bookingRepo.save(this.bookingRepo.create({ userId, status: booking_entity_1.BookingStatus.PENDING, totalAmount: 0 }));
        const lockedSeatIds = [];
        for (const seat of seats) {
            const ok = this.seatLock.tryLock(dto.showtimeId, seat.seatId, booking.bookingId, userId);
            if (!ok) {
                this.seatLock.unlock(dto.showtimeId, lockedSeatIds);
                await this.bookingRepo.delete(booking.bookingId);
                throw new common_1.BadRequestException(`Ghế ${seat.seatNumber} đang được giữ tạm thời bởi người khác. Vui lòng chọn vị trí khác.`);
            }
            lockedSeatIds.push(seat.seatId);
        }
        const totalAmount = seats.reduce((sum, seat) => sum + Number(showtime.ticketPrice) * this.SEAT_PRICE_FACTOR[seat.seatType], 0);
        booking.totalAmount = totalAmount;
        booking = await this.bookingRepo.save(booking);
        let tickets;
        try {
            tickets = await this.ticketRepo.save(seats.map((seat) => this.ticketRepo.create({
                bookingId: booking.bookingId,
                showtimeId: dto.showtimeId,
                seatId: seat.seatId,
                price: Number(showtime.ticketPrice) * this.SEAT_PRICE_FACTOR[seat.seatType],
            })));
        }
        catch (e) {
            this.seatLock.unlock(dto.showtimeId, lockedSeatIds);
            await this.bookingRepo.delete(booking.bookingId);
            throw new common_1.BadRequestException('Ghế vừa được người khác chọn. Vui lòng chọn vị trí khác.');
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
    async createPaymentRequest(userId, bookingId, method) {
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
    async handlePaymentCallback(userId, bookingId, success, transactionId) {
        const booking = await this.getOwnedBooking(userId, bookingId);
        const tickets = await this.ticketRepo.find({
            where: { bookingId },
            relations: ['seat', 'showtime', 'showtime.movie', 'showtime.hall'],
        });
        if (tickets.length === 0)
            throw new common_1.BadRequestException('Đơn hàng không có vé nào');
        const showtimeId = tickets[0].showtimeId;
        if (booking.status === booking_entity_1.BookingStatus.PAID) {
            const emailTickets = await Promise.all(tickets.map(async (t) => ({
                ticketCode: t.ticketCode,
                seatNumber: t.seat.seatNumber,
                price: Number(t.price),
                qrDataUrl: await QRCode.toDataURL(t.ticketCode, { width: 240 }),
            })));
            return {
                message: 'Đơn hàng này đã được thanh toán trước đó (callback lặp được bỏ qua - idempotent).',
                bookingId: booking.bookingId,
                status: booking.status,
                totalAmount: Number(booking.totalAmount),
                tickets: emailTickets,
            };
        }
        if (booking.status === booking_entity_1.BookingStatus.CANCELLED) {
            throw new common_1.BadRequestException('Đơn hàng đã bị hủy. Vui lòng đặt vé mới.');
        }
        if (!success) {
            this.seatLock.unlock(showtimeId, tickets.map((t) => t.seatId));
            await this.bookingRepo.delete(bookingId);
            throw new common_1.BadRequestException('Thanh toán thất bại. Ghế đã được mở khóa, mời bạn chọn lại.');
        }
        const soldByOther = await this.ticketRepo
            .createQueryBuilder('t')
            .innerJoin('t.booking', 'b')
            .where('t.showtimeId = :stId', { stId: showtimeId })
            .andWhere('t.seatId IN (:...seatIds)', { seatIds: tickets.map((t) => t.seatId) })
            .andWhere('b.status = :status', { status: booking_entity_1.BookingStatus.PAID })
            .andWhere('b.bookingId != :bookingId', { bookingId })
            .getCount();
        if (soldByOther > 0) {
            this.seatLock.unlock(showtimeId, tickets.map((t) => t.seatId));
            await this.bookingRepo.delete(bookingId);
            throw new common_1.ConflictException('Có ghế vừa được người khác thanh toán. Vui lòng chọn lại.');
        }
        const user = await this.userRepo.findOneBy({ userId });
        booking.status = booking_entity_1.BookingStatus.PAID;
        booking.paymentQrCode = transactionId || `TX${Date.now()}`;
        await this.bookingRepo.save(booking);
        const emailTickets = [];
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
        const st = tickets[0].showtime;
        try {
            await this.emailService.sendTicketEmail(user?.email || 'unknown@localhost', user?.fullName || 'Khách hàng', {
                bookingId: booking.bookingId,
                movieTitle: st.movie.title,
                startTime: st.startTime,
                hallName: st.hall.hallName,
                seats: emailTickets.map((t) => t.seatNumber).join(', '),
                totalAmount: Number(booking.totalAmount),
                tickets: emailTickets,
            });
        }
        catch (e) {
            this.logger.error('Gửi email xác nhận thất bại', e);
        }
        return {
            message: 'Đặt vé thành công! Vé điện tử đã được gửi tới email của bạn.',
            bookingId: booking.bookingId,
            status: booking.status,
            totalAmount: Number(booking.totalAmount),
            tickets: emailTickets,
        };
    }
    async findMyBookings(userId) {
        return this.bookingRepo.find({
            where: { userId },
            relations: ['tickets', 'tickets.seat', 'tickets.showtime', 'tickets.showtime.movie'],
            order: { bookingDate: 'DESC' },
        });
    }
    async findOneForUser(userId, role, bookingId) {
        const booking = await this.bookingRepo.findOne({
            where: { bookingId },
            relations: [
                'tickets', 'tickets.seat',
                'tickets.showtime', 'tickets.showtime.movie', 'tickets.showtime.hall',
                'user',
            ],
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        if (booking.userId !== userId && role !== 'ADMIN' && role !== 'STAFF') {
            throw new common_1.ForbiddenException('Bạn không có quyền xem đơn hàng này');
        }
        return booking;
    }
    async checkinTicket(ticketCode, staffId) {
        const cleanCode = String(ticketCode || '').trim();
        if (!cleanCode)
            throw new common_1.BadRequestException('Vui lòng nhập mã vé');
        if (cleanCode.endsWith('-USED'))
            throw new common_1.BadRequestException('Vé đã được soát trước đó');
        const ticket = await this.ticketRepo.findOne({
            where: { ticketCode: cleanCode },
            relations: ['booking', 'showtime', 'showtime.movie', 'showtime.hall', 'seat'],
        });
        if (!ticket) {
            const alreadyUsed = await this.ticketRepo.findOneBy({ ticketCode: `${cleanCode}-USED` });
            if (alreadyUsed)
                throw new common_1.BadRequestException('Vé đã được soát trước đó');
        }
        if (!ticket)
            throw new common_1.NotFoundException('Vé không tồn tại hoặc mã không hợp lệ');
        if (ticket.booking.status !== booking_entity_1.BookingStatus.PAID) {
            throw new common_1.BadRequestException('Vé chưa được thanh toán');
        }
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
    async getSeatStatus(showtimeId) {
        const showtime = await this.showtimeRepo.findOneBy({ showtimeId });
        if (!showtime)
            throw new common_1.NotFoundException('Không tìm thấy suất chiếu');
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
            const sold = mine.some((t) => t.booking.status === booking_entity_1.BookingStatus.PAID);
            const pending = mine.some((t) => t.booking.status === booking_entity_1.BookingStatus.PENDING);
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
    async getOwnedBooking(userId, bookingId) {
        const booking = await this.bookingRepo.findOneBy({ bookingId });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        if (booking.userId !== userId)
            throw new common_1.ForbiddenException('Không phải đơn hàng của bạn');
        return booking;
    }
    async getOwnedPendingBooking(userId, bookingId) {
        const booking = await this.bookingRepo.findOneBy({ bookingId });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        if (booking.userId !== userId)
            throw new common_1.ForbiddenException('Không phải đơn hàng của bạn');
        if (booking.status !== booking_entity_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');
        }
        return booking;
    }
    generateTicketCode(bookingId, ticketId) {
        const stamp = Date.now().toString(36).toUpperCase();
        return `CPX-${String(bookingId).padStart(4, '0')}-${String(ticketId).padStart(3, '0')}-${stamp}`;
    }
};
exports.TicketService = TicketService;
exports.TicketService = TicketService = TicketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ticket_entity_1.Ticket)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __param(3, (0, typeorm_1.InjectRepository)(showtime_entity_1.Showtime)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        seat_lock_service_1.SeatLockService,
        payment_gateway_service_1.PaymentGatewayService,
        email_service_1.EmailService])
], TicketService);
//# sourceMappingURL=ticket.service.js.map