import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Locale, TenantContact, TenantFeature, TenantTheme } from '@concierge/types';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) slug!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ type: Object, required: true }) theme!: TenantTheme;
  @Prop({ type: Object, required: true }) contact!: TenantContact;
  @Prop({ type: [String], default: ['fr', 'en'] }) locales!: Locale[];
  @Prop({ default: 'fr' }) defaultLocale!: Locale;
  @Prop({ type: [String], default: ['lobby', 'rooms', 'smiley'] }) features!: TenantFeature[];
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
