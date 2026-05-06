import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupProxies } from './proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, rawBody: true });

  // Security: Helmet + HSTS (1 year, with subdomains and preload)
  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Structured request logging — JSON one line per request (Render-friendly)
  const logger = new Logger('http');
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const dur = Date.now() - start;
      const correlationId = req.headers['x-correlation-id'] || Math.random().toString(36).slice(2, 10);
      logger.log(JSON.stringify({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: dur,
        ua: req.headers['user-agent']?.slice(0, 80),
        ip: req.ip,
        correlationId,
        tenantId: req.headers['x-tenant-id'] ?? null,
      }));
    });
    next();
  });

  // Healthz at gateway level
  app.use('/healthz', (_req: any, res: any) => res.json({ status: 'ok', service: 'api-gateway', uptimeSeconds: Math.floor(process.uptime()) }));

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  setupProxies(app.getHttpAdapter().getInstance());

  const config = new DocumentBuilder()
    .setTitle('Concierge — API Gateway')
    .setDescription('Single entry point for all microservices')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addServer('/')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT_GATEWAY ?? process.env.PORT ?? 3000);
  await app.listen(port);
  new Logger('Bootstrap').log(`API Gateway listening on :${port}`);
  new Logger('Bootstrap').log(`Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();
