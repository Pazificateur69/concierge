import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemInput {
  @ApiProperty() @IsString() menuItemId!: string;
  @ApiProperty() @IsInt() @Min(1) @Type(() => Number) quantity!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() options?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class CreateOrderDto {
  @ApiProperty() @IsString() tenantId!: string;
  @ApiProperty() @IsString() room!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() guestName?: string;
  @ApiProperty({ type: [OrderItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() locale?: string;
  @ApiProperty({ enum: ['kiosk', 'tablet', 'reception'] }) @IsEnum(['kiosk', 'tablet', 'reception'])
  source!: 'kiosk' | 'tablet' | 'reception';
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['pending', 'accepted', 'preparing', 'delivered', 'cancelled'] })
  @IsEnum(['pending', 'accepted', 'preparing', 'delivered', 'cancelled'])
  status!: 'pending' | 'accepted' | 'preparing' | 'delivered' | 'cancelled';
}
