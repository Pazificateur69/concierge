import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'List points of interest for a tenant. Optional ?q= for full-text search across name + description.' })
  list(@Query('tenantId') tenantId: string, @Query('category') category?: PoiCategory, @Query('q') q?: string) {
    return this.poisService.list(tenantId, category, q);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a POI' })
  create(@Query('tenantId') tenantId: string, @Body() dto: any) {
    return this.poisService.create(tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a POI' })
  update(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.poisService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a POI' })
  delete(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.poisService.delete(tenantId, id);
  }
}
