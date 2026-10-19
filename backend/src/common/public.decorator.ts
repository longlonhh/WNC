import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Đánh dấu API công khai, không cần JWT */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
