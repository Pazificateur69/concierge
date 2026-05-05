import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { ContentBlock, LocalizedString } from '@concierge/types';

export type ContentPageDocument = HydratedDocument<ContentPageEntity>;

@Schema({ timestamps: true, collection: 'content_pages' })
export class ContentPageEntity {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ required: true }) slug!: string;
  @Prop({ type: Object, required: true }) title!: LocalizedString;
  @Prop({ type: [Object], default: [] }) blocks!: ContentBlock[];
  @Prop({ default: true }) published!: boolean;
  @Prop({ default: 1 }) version!: number;
}

export const ContentPageSchema = SchemaFactory.createForClass(ContentPageEntity);
ContentPageSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
