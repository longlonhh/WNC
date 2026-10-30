import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  @MaxLength(100)
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0' })
  phone?: string;
}
