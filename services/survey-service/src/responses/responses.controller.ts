import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponsesService } from './responses.service';
import { CurrentUser, Roles, RolesGuard } from '@concierge/nest-common';
import type { JwtPayload, SubmitSurveyRequest } from '@concierge/types';

@ApiTags('survey-responses')
@Controller()
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post(':slug/responses')
  @ApiOperation({ summary: 'Public — submit a survey response (kiosk)' })
  submit(
    @Query('tenantId') tenantId: string,
    @Param('slug') slug: string,
    @Body() dto: SubmitSurveyRequest,
  ) {
    return this.responsesService.submit(tenantId, slug, dto);
  }

  @Get(':surveyId/responses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  list(@CurrentUser() user: JwtPayload, @Param('surveyId') surveyId: string) {
    return this.responsesService.list(user.tenantId, surveyId);
  }

  @Get(':surveyId/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  stats(@CurrentUser() user: JwtPayload, @Param('surveyId') surveyId: string) {
    return this.responsesService.stats(user.tenantId, surveyId);
  }
}
