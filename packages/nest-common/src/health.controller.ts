import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  private readonly startTime = Date.now();

  @Get('healthz')
  health() {
    return {
      status: 'ok',
      service: process.env.npm_package_name ?? process.env.SERVICE_NAME ?? 'concierge-service',
      version: process.env.npm_package_version ?? '0.1.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }

  @Get('readyz')
  ready() {
    return { ready: true, timestamp: new Date().toISOString() };
  }
}
