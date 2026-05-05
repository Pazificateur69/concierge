import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderEntity, OrderDocument } from './order.schema';
import { MenuItemEntity, MenuItemDocument } from '../menu/menu-item.schema';
import type { Order, OrderStatus } from '@concierge/types';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';
import { OrdersGateway } from './orders.gateway';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(OrderEntity.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItemEntity.name) private readonly menuModel: Model<MenuItemDocument>,
    private readonly gateway: OrdersGateway,
  ) {}

  async list(tenantId: string, status?: OrderStatus, room?: string): Promise<Order[]> {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (room) filter.room = room;
    const items = await this.orderModel.find(filter).sort({ createdAt: -1 }).limit(100);
    return items.map((o) => this.toDto(o));
  }

  async findById(tenantId: string, id: string): Promise<Order> {
    const o = await this.orderModel.findOne({ _id: id, tenantId });
    if (!o) throw new NotFoundException('Order not found');
    return this.toDto(o);
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const menuIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.menuModel.find({ tenantId: dto.tenantId, _id: { $in: menuIds } });
    if (menuItems.length !== menuIds.length) {
      throw new BadRequestException('Some menu items are unknown for this tenant');
    }

    const items = dto.items.map((it) => {
      const menu = menuItems.find((m) => m._id.toString() === it.menuItemId)!;
      return {
        menuItemId: it.menuItemId,
        name: (menu.name as any).fr || Object.values(menu.name)[0] || 'Item',
        quantity: it.quantity,
        unitPrice: menu.price,
        options: it.options,
        notes: it.notes,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const order = await this.orderModel.create({
      tenantId: dto.tenantId,
      room: dto.room,
      guestName: dto.guestName,
      items,
      subtotal,
      total: subtotal,
      currency: 'EUR',
      status: 'pending',
      statusHistory: [{ status: 'pending', at: new Date().toISOString() }],
      locale: dto.locale ?? 'fr',
      source: dto.source,
      notes: dto.notes,
    });

    const dtoOut = this.toDto(order);
    this.gateway.emitNewOrder(dtoOut);
    return dtoOut;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto, userId?: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: id, tenantId });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }
    order.status = dto.status;
    order.statusHistory.push({ status: dto.status, at: new Date().toISOString(), by: userId });
    await order.save();

    const dtoOut = this.toDto(order);
    this.gateway.emitOrderUpdated(dtoOut);
    return dtoOut;
  }

  private toDto(o: OrderDocument): Order {
    return {
      id: o._id.toString(),
      tenantId: o.tenantId,
      room: o.room,
      guestName: o.guestName,
      items: o.items,
      subtotal: o.subtotal,
      total: o.total,
      currency: o.currency,
      status: o.status,
      statusHistory: o.statusHistory,
      locale: o.locale,
      notes: o.notes,
      source: o.source,
      createdAt: (o as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (o as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
