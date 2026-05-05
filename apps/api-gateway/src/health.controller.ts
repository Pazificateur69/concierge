import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() };
  }

  @Get()
  root() {
    return {
      service: 'Concierge API Gateway',
      version: '0.1.0',
      docs: '/api/docs',
      services: ['/auth', '/tenants', '/content', '/orders', '/surveys'],
    };
  }
}
