import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './pages.dto';
import { Roles, RolesGuard } from '@concierge/nest-common';

@ApiTags('content-pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @ApiOperation({ summary: 'List published pages for a tenant' })
  list(@Query('tenant') tenantSlug: string, @Query('tenantId') tenantId?: string) {
    return this.pagesService.list(tenantId || tenantSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get one page by slug for a tenant' })
  findOne(@Query('tenant') tenantSlug: string, @Param('slug') slug: string, @Query('tenantId') tenantId?: string) {
    return this.pagesService.findBySlug(tenantId || tenantSlug, slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto as any);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  delete(@Param('id') id: string) {
    return this.pagesService.delete(id);
  }
}
