import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Locale, OrderItem, OrderStatus, OrderStatusEvent } from '@concierge/types';

export type OrderDocument = HydratedDocument<OrderEntity>;

@Schema({ timestamps: true, collection: 'orders' })
export class OrderEntity {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ required: true }) room!: string;
  @Prop() guestName?: string;
  @Prop({ type: [Object], required: true }) items!: OrderItem[];
  @Prop({ required: true }) subtotal!: number;
  @Prop({ required: true }) total!: number;
  @Prop({ default: 'EUR' }) currency!: string;
  @Prop({ required: true, enum: ['pending', 'accepted', 'preparing', 'delivered', 'cancelled'], default: 'pending' })
  status!: OrderStatus;
  @Prop({ type: [Object], default: [] }) statusHistory!: OrderStatusEvent[];
  @Prop({ default: 'fr' }) locale!: Locale;
  @Prop() notes?: string;
  @Prop({ enum: ['kiosk', 'tablet', 'reception'], default: 'tablet' })
  source!: 'kiosk' | 'tablet' | 'reception';
}

export const OrderSchema = SchemaFactory.createForClass(OrderEntity);
OrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
