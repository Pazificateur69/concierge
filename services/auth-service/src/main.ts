import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@concierge/nest-common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('auth');

  const config = new DocumentBuilder()
    .setTitle('Concierge — auth-service')
    .setDescription('Authentication, JWT, multi-tenant, RBAC')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  const port = Number(process.env.PORT_AUTH ?? process.env.PORT ?? 3001);
  await app.listen(port);
  new Logger('Bootstrap').log(`auth-service listening on :${port}`);
}
bootstrap();
