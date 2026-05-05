import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { CurrentUser, Roles, RolesGuard } from '@concierge/nest-common';
import type { JwtPayload } from '@concierge/types';

@ApiTags('surveys')
@Controller()
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Public — get a survey by slug for kiosk display' })
  bySlug(@Query('tenantId') tenantId: string, @Param('slug') slug: string) {
    return this.surveysService.findBySlug(tenantId, slug);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  list(@CurrentUser() user: JwtPayload) {
    return this.surveysService.list(user.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.surveysService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: any) {
    return this.surveysService.update(user.tenantId, id, dto);
  }
}
