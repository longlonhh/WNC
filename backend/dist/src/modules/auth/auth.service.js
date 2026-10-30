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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/user.entity");
let AuthService = class AuthService {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const exists = await this.userRepository.findOneBy({ email: dto.email });
        if (exists)
            throw new common_1.ConflictException('Email đã được sử dụng');
        const user = this.userRepository.create({
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            passwordHash: await bcrypt.hash(dto.password, 10),
            role: user_entity_1.UserRole.CUSTOMER,
        });
        const saved = await this.userRepository.save(user);
        return this.generateToken(saved);
    }
    async login(dto) {
        const user = await this.userRepository.findOneBy({ email: dto.email });
        if (!user)
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        return this.generateToken(user);
    }
    generateToken(user) {
        const payload = { sub: user.userId, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map