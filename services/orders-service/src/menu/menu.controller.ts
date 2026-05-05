import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Roles, RolesGuard } from '@concierge/nest-common';
import type { OrderCategory } from '@concierge/types';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  list(@Query('tenantId') tenantId: string, @Query('category') category?: OrderCategory) {
    return this.menuService.list(tenantId, category);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Query('tenantId') tenantId: string, @Body() dto: any) {
    return this.menuService.create(tenantId, dto);
  }
}
