import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { ContentPageEntity, ContentPageSchema } from './page.schema';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  imports: [MongooseModule.forFeature([{ name: ContentPageEntity.name, schema: ContentPageSchema }])],
  controllers: [PagesController],
  providers: [PagesService, JwtStrategy],
})
export class PagesModule {}
