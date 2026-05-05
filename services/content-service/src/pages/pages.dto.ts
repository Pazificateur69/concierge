import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePageDto {
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty() @IsObject() title!: Record<string, string>;
  @ApiProperty({ type: [Object] }) @IsArray() blocks!: any[];
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdatePageDto extends PartialType(CreatePageDto) {}
