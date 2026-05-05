import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { LocalizedString, PoiCategory } from '@concierge/types';

export type PoiDocument = HydratedDocument<PoiEntity>;

@Schema({ timestamps: true, collection: 'pois' })
export class PoiEntity {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ type: Object, required: true }) name!: LocalizedString;
  @Prop({ required: true }) category!: PoiCategory;
  @Prop({ required: true }) lat!: number;
  @Prop({ required: true }) lng!: number;
  @Prop({ type: Object }) description?: LocalizedString;
  @Prop() photo?: string;
  @Prop() rating?: number;
  @Prop() hours?: string;
  @Prop() phone?: string;
  @Prop() website?: string;
}
export const PoiSchema = SchemaFactory.createForClass(PoiEntity);
PoiSchema.index({ tenantId: 1, category: 1 });
