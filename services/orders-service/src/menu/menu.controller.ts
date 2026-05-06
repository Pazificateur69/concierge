import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Roles, RolesGuard } from '@concierge/nest-common';
import type { OrderCategory } from '@concierge/types';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List menu items for a tenant — pass ?available=all to include unavailable' })
  list(
    @Query('tenantId') tenantId: string,
    @Query('category') category?: OrderCategory,
    @Query('available') available?: string,
  ) {
    return this.menuService.list(tenantId, category, available !== 'all');
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a menu item' })
  create(@Query('tenantId') tenantId: string, @Body() dto: any) {
    return this.menuService.create(tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu item' })
  update(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.menuService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu item' })
  delete(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menuService.delete(tenantId, id);
  }
}
