import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupProxies } from './proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, rawBody: true });
  app.use(helmet({ contentSecurityPolicy: false }));
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
