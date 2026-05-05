import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './tenant.dto';
import { Roles, RolesGuard } from '@concierge/nest-common';

@ApiTags('tenants')
@Controller()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public info of a tenant by slug (no auth needed)' })
  bySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  list() {
    return this.tenantService.list();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto as any);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto as any);
  }
}
