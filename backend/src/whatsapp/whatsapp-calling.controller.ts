import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappCallingService, CallState } from './whatsapp-calling.service';
import { UpdateCallSettingsDto } from './dto/update-call-settings.dto';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { CallActionDto } from './dto/call-action.dto';
import { RecordConsentDto } from './dto/record-consent.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../iam/interfaces/authenticated-request.interface';

@ApiTags('whatsapp-calling')
@ApiBearerAuth()
@Controller('whatsapp/calling')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class WhatsappCallingController {
  constructor(private readonly callingService: WhatsappCallingService) {}

  @Get('eligibility')
  @ApiOperation({ summary: 'Verifica elegibilidade para chamadas de saída (limite de mensagens ≥ 2000)' })
  eligibility(@Request() req: AuthenticatedRequest) {
    return this.callingService.getCallingEligibility(req.user.id, req);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Obtém a configuração de chamadas atual (Meta ou cache local)' })
  settings() {
    return this.callingService.getCallSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Atualiza a configuração de chamadas na Meta (status, ícone, horários, callback)' })
  updateSettings(@Body() dto: UpdateCallSettingsDto, @Request() req: AuthenticatedRequest) {
    return this.callingService.updateCallSettings(dto, req.user.id, req);
  }

  @Get('calls')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Lista as chamadas ativas em memória' })
  activeCalls(): CallState[] {
    return this.callingService.getActiveCalls();
  }

  @Post('calls')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Inicia uma chamada de saída (exige permissão do cliente e SDP offer)' })
  initiateCall(@Body() dto: InitiateCallDto, @Request() req: AuthenticatedRequest) {
    return this.callingService.initiateCall(dto, req.user.id, req);
  }

  @Post('actions')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Executa ação em uma chamada (pre_accept, accept, reject, terminate)' })
  callAction(@Body() dto: CallActionDto, @Request() req: AuthenticatedRequest) {
    return this.callingService.callAction(dto, req.user.id, req);
  }

  @Get('permissions/:waId')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Verifica a permissão de chamada de saída de um cliente (BSUID wa_id)' })
  callPermission(@Param('waId') waId: string, @Request() req: AuthenticatedRequest) {
    return this.callingService.getConsent(waId, req.user.id, req);
  }

  // ---------------------------------------------------------------------------
  // Consentimento LGPD (Fase 4)
  // ---------------------------------------------------------------------------

  @Get('consent/:waId')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Consulta consentimento LGPD e permissão da Meta para um WhatsApp' })
  consent(@Param('waId') waId: string, @Request() req: AuthenticatedRequest) {
    return this.callingService.getConsent(waId, req.user.id, req);
  }

  @Post('consent')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Registra o consentimento LGPD do cliente para receber chamadas de voz' })
  recordConsent(@Body() dto: RecordConsentDto, @Request() req: AuthenticatedRequest) {
    return this.callingService.recordConsent(dto, req.user.id, req);
  }

  @Delete('consent/:waId')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Revoga o consentimento LGPD do cliente (direito de objeção)' })
  revokeConsent(@Param('waId') waId: string, @Request() req: AuthenticatedRequest) {
    return this.callingService.revokeConsent(waId, req.user.id, req);
  }

  // ---------------------------------------------------------------------------
  // Logs e retenção (Fase 4)
  // ---------------------------------------------------------------------------

  @Get('logs')
  @ApiOperation({ summary: 'Lista os registros de chamadas (CtiLogs) com paginação' })
  logs(@Query('page') page: string, @Query('limit') limit: string, @Query('ticket_id') ticket_id: string, @Request() req: AuthenticatedRequest) {
    return this.callingService.listLogs(
      {
        page: page ? +page : 1,
        limit: limit ? +limit : 20,
        ticket_id: ticket_id ? +ticket_id : undefined,
      },
      req.user.id,
      req,
    );
  }

  @Delete('logs/:id')
  @ApiOperation({ summary: 'Apaga um registro de chamada (LGPD - direito ao apagamento)' })
  deleteLog(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.callingService.deleteLog(+id, req.user.id, req);
  }

  @Post('maintenance/purge')
  @ApiOperation({ summary: 'Executa a retenção de logs de chamadas (exclusão e anonimização conforme política)' })
  purge() {
    return this.callingService.purgeExpiredLogs();
  }
}