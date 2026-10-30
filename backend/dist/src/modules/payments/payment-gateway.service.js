"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PaymentGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayService = void 0;
const common_1 = require("@nestjs/common");
const QRCode = require("qrcode");
let PaymentGatewayService = PaymentGatewayService_1 = class PaymentGatewayService {
    constructor() {
        this.logger = new common_1.Logger(PaymentGatewayService_1.name);
    }
    async createPaymentRequest(input) {
        const transactionId = (input.method === 'VNPAY' ? 'VNP' : 'MOMO') +
            Date.now().toString(36).toUpperCase() +
            Math.floor(Math.random() * 1000);
        const paymentUrl = input.method === 'VNPAY'
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
};
exports.PaymentGatewayService = PaymentGatewayService;
exports.PaymentGatewayService = PaymentGatewayService = PaymentGatewayService_1 = __decorate([
    (0, common_1.Injectable)()
], PaymentGatewayService);
//# sourceMappingURL=payment-gateway.service.js.map