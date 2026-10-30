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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
        this.transporter = null;
        const host = process.env.SMTP_HOST;
        if (host) {
            this.transporter = nodemailer.createTransport({
                host,
                port: Number(process.env.SMTP_PORT || 587),
                secure: Number(process.env.SMTP_PORT || 587) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }
    async sendTicketEmail(to, fullName, data) {
        const vnp = new Intl.NumberFormat('vi-VN').format(Number(data.totalAmount));
        const rows = data.tickets
            .map((t) => `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd">${t.seatNumber}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${t.ticketCode}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${new Intl.NumberFormat('vi-VN').format(t.price)}đ</td>
        </tr>`)
            .join('');
        const qrSection = data.tickets
            .map((t) => `<div style="text-align:center;margin:12px 0">
          <img src="${t.qrDataUrl}" alt="QR ${t.ticketCode}" width="160" height="160"/>
          <div style="font-family:monospace;color:#555">${t.ticketCode}</div>
        </div>`)
            .join('');
        const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#e11d48">🎬 Cinema Star - Xác nhận đặt vé thành công</h2>
      <p>Xin chào <b>${fullName}</b>,</p>
      <p>Cảm ơn bạn đã đặt vé tại Cinema Star. Thông tin đơn hàng <b>#${data.bookingId}</b>:</p>
      <ul>
        <li><b>Phim:</b> ${data.movieTitle}</li>
        <li><b>Suất chiếu:</b> ${new Date(data.startTime).toLocaleString('vi-VN')}</li>
        <li><b>Phòng:</b> ${data.hallName}</li>
        <li><b>Ghế:</b> ${data.seats}</li>
        <li><b>Tổng tiền:</b> ${vnp}đ</li>
      </ul>
      ${qrSection}
      <p>Vui lòng đưa mã QR cho nhân viên soát vé tại rạp. Chúc bạn xem phim vui vẻ! 🍿</p>
    </div>`;
        if (!this.transporter) {
            this.logger.log(`[EMAIL-DRY-RUN] Gửi tới ${to}: đơn #${data.bookingId} - ${data.movieTitle} (${data.tickets.length} vé QR)`);
            return { sent: false, dryRun: true };
        }
        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'Cinema Star <no-reply@cinemastar.vn>',
            to,
            subject: `🎬 Xác nhận đặt vé #${data.bookingId} - ${data.movieTitle}`,
            html,
        });
        return { sent: true };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map