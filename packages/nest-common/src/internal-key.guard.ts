import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-internal-key'];
    const expected = process.env.INTERNAL_KEY;
    if (!expected) return true;
    if (provided !== expected) throw new UnauthorizedException('Invalid internal key');
    return true;
  }
}
