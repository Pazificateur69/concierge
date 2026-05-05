import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Locale, UserRole } from '@concierge/types';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class RefreshTokenEntry {
  @Prop({ required: true }) token!: string;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop() deviceId?: string;
  @Prop({ default: () => new Date() }) createdAt!: Date;
}
const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenEntry);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, index: true }) tenantId!: string;
  @Prop({ required: true, lowercase: true, trim: true }) email!: string;
  @Prop({ required: true }) passwordHash!: string;
  @Prop({ required: true }) firstName!: string;
  @Prop({ required: true }) lastName!: string;
  @Prop({ required: true, enum: ['superadmin', 'admin', 'staff', 'guest'] })
  role!: UserRole;
  @Prop({ default: 'fr' }) locale!: Locale;
  @Prop({ type: [RefreshTokenSchema], default: [] }) refreshTokens!: RefreshTokenEntry[];
  @Prop({ default: true }) active!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
