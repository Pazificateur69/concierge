import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsObject() theme!: Record<string, any>;
  @ApiProperty() @IsObject() contact!: Record<string, any>;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() locales?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() defaultLocale?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() features?: string[];
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
