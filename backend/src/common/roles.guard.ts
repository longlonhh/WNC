import {
  CanActivate, ExecutionContext, Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../modules/users/user.entity';

/**
 * RolesGuard - phân quyền API theo vai trò (ADMIN / STAFF / CUSTOMER)
 * Theo tài liệu: "phân quyền Guards (@Roles('ADMIN'), @Roles('CUSTOMER'))"
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }
}
