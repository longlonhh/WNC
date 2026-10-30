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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateSeatsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class GenerateSeatsDto {
}
exports.GenerateSeatsDto = GenerateSeatsDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2, { message: 'Số hàng tối thiểu 2' }),
    (0, class_validator_1.Max)(16, { message: 'Số hàng tối đa 16' }),
    __metadata("design:type", Number)
], GenerateSeatsDto.prototype, "rows", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(4, { message: 'Số cột tối thiểu 4' }),
    (0, class_validator_1.Max)(20, { message: 'Số cột tối đa 20' }),
    __metadata("design:type", Number)
], GenerateSeatsDto.prototype, "cols", void 0);
//# sourceMappingURL=generate-seats.dto.js.map