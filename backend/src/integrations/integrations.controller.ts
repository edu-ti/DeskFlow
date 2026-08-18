import { Controller, Get, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('issue-trackers')
  issueTrackers() {
    return this.integrationsService.listIssueTrackers();
  }

  @Get('monitoring')
  monitoring() {
    return this.integrationsService.listMonitoring();
  }
}
