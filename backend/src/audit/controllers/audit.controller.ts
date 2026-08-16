import { Controller, Get, Post, Param, Query, UseGuards, Request, Response, Body } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin')
  async getLogs(
    @Query('action') action?: string,
    @Query('entity_type') entity_type?: string,
    @Query('user_id') user_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getLogs({
      action,
      entity_type,
      user_id: user_id ? +user_id : undefined,
      start_date,
      end_date,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('export-csv')
  @Roles('admin')
  async exportCsv(@Query() query: any, @Response() res: any) {
    const csvData = await this.auditService.exportLogsCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="trilha_auditoria_deskflow.csv"');
    return res.send(csvData);
  }

  @Get('export-user-data/:id')
  @Roles('admin')
  async exportUserData(@Param('id') id: string) {
    return this.auditService.exportUserData(+id);
  }

  @Post('anonymize-user/:id')
  @Roles('admin')
  async anonymizeUser(@Param('id') id: string, @Request() req: any) {
    const actorId = req.user?.userId || req.user?.id || 1;
    return this.auditService.anonymizeUser(+id, actorId, req);
  }
}
