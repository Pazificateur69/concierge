import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Locale, LocalizedString, Question } from '@concierge/types';

export type SurveyDocument = HydratedDocument<SurveyEntity>;

@Schema({ timestamps: true, collection: 'surveys' })
export class SurveyEntity {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ required: true }) slug!: string;
  @Prop({ type: Object, required: true }) title!: LocalizedString;
  @Prop({ type: Object }) description?: LocalizedString;
  @Prop({ type: [Object], default: [] }) questions!: Question[];
  @Prop({ type: [String], default: ['fr', 'en'] }) locales!: Locale[];
  @Prop() publishedAt?: Date;
  @Prop() expiresAt?: Date;
}
export const SurveySchema = SchemaFactory.createForClass(SurveyEntity);
SurveySchema.index({ tenantId: 1, slug: 1 }, { unique: true });
