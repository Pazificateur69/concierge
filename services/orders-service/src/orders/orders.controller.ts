import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';
import { CurrentUser, Roles, RolesGuard } from '@concierge/nest-common';
import type { JwtPayload, OrderStatus } from '@concierge/types';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'admin')
  @ApiBearerAuth()
  list(@CurrentUser() user: JwtPayload, @Query('status') status?: OrderStatus, @Query('room') room?: string) {
    return this.ordersService.list(user.tenantId, status, room);
  }

  @Post()
  @ApiOperation({ summary: 'Create an order (no auth — kiosk public)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.findById(user.tenantId, id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'admin')
  @ApiBearerAuth()
  updateStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(user.tenantId, id, dto, user.sub);
  }
}
