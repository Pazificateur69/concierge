import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { OrderEntity, OrderSchema } from './order.schema';
import { MenuItemEntity, MenuItemSchema } from '../menu/menu-item.schema';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderEntity.name, schema: OrderSchema },
      { name: MenuItemEntity.name, schema: MenuItemSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway, JwtStrategy],
  exports: [OrdersService],
})
export class OrdersModule {}
