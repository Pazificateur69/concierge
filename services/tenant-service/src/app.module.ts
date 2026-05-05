import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantModule } from './tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/concierge'),
    TenantModule,
  ],
})
export class AppModule {}
