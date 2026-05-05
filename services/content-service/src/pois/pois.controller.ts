import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PoisService } from './pois.service';
import { Roles, RolesGuard } from '@concierge/nest-common';
import type { PoiCategory } from '@concierge/types';

@ApiTags('content-pois')
@Controller('pois')
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  @Get()
  @ApiOperation({ summary: 'List points of interest for a tenant' })
  list(@Query('tenantId') tenantId: string, @Query('category') category?: PoiCategory) {
    return this.poisService.list(tenantId, category);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Query('tenantId') tenantId: string, @Body() dto: any) {
    return this.poisService.create(tenantId, dto);
  }
}
