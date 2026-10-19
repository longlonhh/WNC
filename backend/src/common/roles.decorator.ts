import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../modules/users/user.entity';

export const ROLES_KEY = 'roles';
/** @Roles('ADMIN') hoặc @Roles(UserRole.ADMIN, UserRole.STAFF) */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
