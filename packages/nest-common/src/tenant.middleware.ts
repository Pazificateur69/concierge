import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant-context';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('X-Request-Id', requestId);

    const user = (req as any).user as { tenantId?: string; sub?: string; role?: string } | undefined;
    const headerTenant = (req.headers['x-tenant-slug'] as string) || (req.headers['x-tenant-id'] as string);

    const tenantId = user?.tenantId ?? headerTenant ?? '';

    TenantContext.run(
      {
        tenantId,
        userId: user?.sub,
        role: user?.role,
        requestId,
      },
      () => next(),
    );
  }
}
