import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { LocalizedString, MenuItemOption, OrderCategory } from '@concierge/types';

export type MenuItemDocument = HydratedDocument<MenuItemEntity>;

@Schema({ timestamps: true, collection: 'menu_items' })
export class MenuItemEntity {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ required: true }) category!: OrderCategory;
  @Prop({ type: Object, required: true }) name!: LocalizedString;
  @Prop({ type: Object }) description?: LocalizedString;
  @Prop({ required: true }) price!: number;
  @Prop({ default: 'EUR' }) currency!: string;
  @Prop() image?: string;
  @Prop({ type: [Object] }) options?: MenuItemOption[];
  @Prop({ type: [String] }) allergens?: string[];
  @Prop({ default: true }) available!: boolean;
  @Prop() preparationMinutes?: number;
}
export const MenuItemSchema = SchemaFactory.createForClass(MenuItemEntity);
MenuItemSchema.index({ tenantId: 1, category: 1, available: 1 });
