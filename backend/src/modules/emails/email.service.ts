import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface TicketEmailData {
  bookingId: number;
  movieTitle: string;
  startTime: Date;
  hallName: string;
  seats: string;
  totalAmount: number;
  tickets: Array<{ ticketCode: string; seatNumber: string; price: number; qrDataUrl: string }>;
}

/**
 * Notification / Email Module
 * "Tích hợp @nestjs-modules/mailer hoặc Nodemailer để gửi email chứa QR Code
 *  tự động sau khi nhận Callback thanh toán thành công."
 * Nếu chưa cấu hình SMTP -> chỉ ghi log nội dung email (dễ demo).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
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

  async sendTicketEmail(to: string, fullName: string, data: TicketEmailData) {
    const vnp = new Intl.NumberFormat('vi-VN').format(Number(data.totalAmount));
    const rows = data.tickets
      .map(
        (t) => `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd">${t.seatNumber}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${t.ticketCode}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${new Intl.NumberFormat('vi-VN').format(t.price)}đ</td>
        </tr>`,
      )
      .join('');

    const qrSection = data.tickets
      .map(
        (t) => `<div style="text-align:center;margin:12px 0">
          <img src="${t.qrDataUrl}" alt="QR ${t.ticketCode}" width="160" height="160"/>
          <div style="font-family:monospace;color:#555">${t.ticketCode}</div>
        </div>`,
      )
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
}
