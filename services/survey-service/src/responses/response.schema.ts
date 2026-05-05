import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Locale, SurveyAnswer, SurveyResponseMetadata } from '@concierge/types';

export type ResponseDocument = HydratedDocument<ResponseEntity>;

@Schema({ timestamps: true, collection: 'survey_responses' })
export class ResponseEntity {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ required: true, index: true }) surveyId!: string;
  @Prop({ type: [Object], required: true }) answers!: SurveyAnswer[];
  @Prop({ default: 'fr' }) locale!: Locale;
  @Prop({ type: Object }) metadata?: SurveyResponseMetadata;
  @Prop({ default: () => new Date() }) completedAt!: Date;
}
export const ResponseSchema = SchemaFactory.createForClass(ResponseEntity);
ResponseSchema.index({ tenantId: 1, surveyId: 1, completedAt: -1 });
