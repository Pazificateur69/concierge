import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuItemEntity, MenuItemSchema } from './menu-item.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MenuItemEntity.name, schema: MenuItemSchema }])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
