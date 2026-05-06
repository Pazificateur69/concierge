import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SurveysModule } from './surveys/surveys.module';
import { ResponsesModule } from './responses/responses.module';
import { HealthController } from '@concierge/nest-common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'dev_secret_change_me', signOptions: { expiresIn: '15m' } }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/concierge'),
    SurveysModule,
    ResponsesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
