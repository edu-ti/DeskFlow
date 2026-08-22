import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './services/analytics.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  getKpis(@Query('period') period: string, @Query('groupId') groupId: string) {
    return this.analyticsService.getKpis(period, groupId);
  }

  @Get('tickets-by-status')
  getTicketsByStatus(@Query('period') period: string, @Query('groupId') groupId: string) {
    return this.analyticsService.getTicketsByStatus(period, groupId);
  }

  @Get('tickets-by-group')
  getTicketsByGroup(@Query('period') period: string, @Query('groupId') groupId: string) {
    return this.analyticsService.getTicketsByGroup(period, groupId);
  }

  @Get('timeline')
  getTimeline(@Query('period') period: string, @Query('groupId') groupId: string) {
    return this.analyticsService.getTicketsTimeline(period, groupId);
  }

  @Get('agent-productivity')
  getAgentProductivity(@Query('period') period: string, @Query('groupId') groupId: string) {
    return this.analyticsService.getAgentProductivity(period, groupId);
  }

  @Get('executive-ranking')
  getExecutiveRanking(@Query('period') period: string, @Query('groupId') groupId: string) {
    return this.analyticsService.getExecutiveRanking(period, groupId);
  }

  @Get('export')
  async exportCsv(@Query('period') period: string, @Query('groupId') groupId: string) {
    const csv = await this.analyticsService.exportCsv(period, groupId);
    return { data: csv };
  }
}
