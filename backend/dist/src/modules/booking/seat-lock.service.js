"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SeatLockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatLockService = void 0;
const common_1 = require("@nestjs/common");
let SeatLockService = SeatLockService_1 = class SeatLockService {
    constructor() {
        this.logger = new common_1.Logger(SeatLockService_1.name);
        this.locks = new Map();
        this.TTL_MS = 8 * 60 * 1000;
    }
    onModuleInit() {
        this.timer = setInterval(() => this.cleanup(), 30_000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    key(showtimeId, seatId) {
        return `${showtimeId}:${seatId}`;
    }
    tryLock(showtimeId, seatId, bookingId, userId) {
        const k = this.key(showtimeId, seatId);
        const existing = this.locks.get(k);
        const now = Date.now();
        if (existing && existing.bookingId === bookingId) {
            existing.expiresAt = now + this.TTL_MS;
            return true;
        }
        if (existing && existing.expiresAt > now)
            return false;
        this.locks.set(k, { bookingId, userId, expiresAt: now + this.TTL_MS });
        return true;
    }
    isLocked(showtimeId, seatId) {
        const entry = this.locks.get(this.key(showtimeId, seatId));
        return !!entry && entry.expiresAt > Date.now();
    }
    lockOwner(showtimeId, seatId) {
        const entry = this.locks.get(this.key(showtimeId, seatId));
        return entry && entry.expiresAt > Date.now() ? entry.userId : null;
    }
    unlock(showtimeId, seatIds) {
        for (const seatId of seatIds)
            this.locks.delete(this.key(showtimeId, seatId));
    }
    expiresInSeconds(bookingId) {
        for (const v of this.locks.values()) {
            if (v.bookingId === bookingId) {
                return Math.max(0, Math.floor((v.expiresAt - Date.now()) / 1000));
            }
        }
        return 0;
    }
    cleanup() {
        const now = Date.now();
        for (const [k, v] of this.locks.entries()) {
            if (v.expiresAt <= now)
                this.locks.delete(k);
        }
    }
};
exports.SeatLockService = SeatLockService;
exports.SeatLockService = SeatLockService = SeatLockService_1 = __decorate([
    (0, common_1.Injectable)()
], SeatLockService);
//# sourceMappingURL=seat-lock.service.js.map