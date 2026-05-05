import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { UserRole } from '@concierge/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: UserRole } | undefined;
    if (!user || !user.role) throw new ForbiddenException('No role on token');
    if (user.role === 'superadmin') return true;
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Required roles: ${required.join(', ')}`);
    }
    return true;
  }
}
