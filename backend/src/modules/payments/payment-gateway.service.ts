import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

export interface PaymentRequestInput {
  bookingId: number;
  amount: number;
  method: 'VNPAY' | 'MOMO';
  customerEmail?: string;
}

export interface PaymentRequestResult {
  transactionId: string;
  method: 'VNPAY' | 'MOMO';
  amount: number;
  paymentUrl: string;
  qrDataUrl: string;
  /** Nội dung cần "quét" để mô phỏng xác nhận thanh toán (dùng ở trang thanh toán demo) */
  simulatePayload: string;
}

/**
 * PaymentGatewayService - Cổng thanh toán (Giả lập VNPay / MoMo QR)
 * Khi có tài khoản thật: thay phần generate bằng SDK/của VNPay (vnp_CreatePayment)
 * hoặc MoMo (captureWallet) và xác thực callback bằng checksum.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  async createPaymentRequest(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const transactionId =
      (input.method === 'VNPAY' ? 'VNP' : 'MOMO') +
      Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 1000);

    const paymentUrl =
      input.method === 'VNPAY'
        ? `http://localhost:3000/payment/simulate?method=VNPAY&bookingId=${input.bookingId}&txn=${transactionId}&amount=${input.amount}`
        : `http://localhost:3000/payment/simulate?method=MOMO&bookingId=${input.bookingId}&txn=${transactionId}&amount=${input.amount}`;

    const payload = JSON.stringify({
      gateway: input.method,
      txn: transactionId,
      bookingId: input.bookingId,
      amount: input.amount,
    });
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 240 });

    this.logger.log(`[MOCK-GATEWAY] Tạo giao dịch ${transactionId} - ${input.amount}đ (${input.method})`);

    return { transactionId, method: input.method, amount: input.amount, paymentUrl, qrDataUrl, simulatePayload: payload };
  }
}
