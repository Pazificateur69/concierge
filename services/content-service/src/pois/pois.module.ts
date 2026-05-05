import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoisController } from './pois.controller';
import { PoisService } from './pois.service';
import { PoiEntity, PoiSchema } from './poi.schema';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  imports: [MongooseModule.forFeature([{ name: PoiEntity.name, schema: PoiSchema }])],
  controllers: [PoisController],
  providers: [PoisService, JwtStrategy],
})
export class PoisModule {}
