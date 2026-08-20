import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappCallingService, CallState } from './whatsapp-calling.service';
import { UpdateCallSettingsDto } from './dto/update-call-settings.dto';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { CallActionDto } from './dto/call-action.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@ApiTags('whatsapp-calling')
@ApiBearerAuth()
@Controller('whatsapp/calling')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class WhatsappCallingController {
  constructor(private readonly callingService: WhatsappCallingService) {}

  @Get('eligibility')
  @ApiOperation({ summary: 'Verifica elegibilidade para chamadas de saída (limite de mensagens ≥ 2000)' })
  eligibility() {
    return this.callingService.getCallingEligibility();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Obtém a configuração de chamadas atual (Meta ou cache local)' })
  settings() {
    return this.callingService.getCallSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Atualiza a configuração de chamadas na Meta (status, ícone, horários, callback)' })
  updateSettings(@Body() dto: UpdateCallSettingsDto) {
    return this.callingService.updateCallSettings(dto);
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
  initiateCall(@Body() dto: InitiateCallDto) {
    return this.callingService.initiateCall(dto);
  }

  @Post('actions')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Executa ação em uma chamada (pre_accept, accept, reject, terminate)' })
  callAction(@Body() dto: CallActionDto) {
    return this.callingService.callAction(dto);
  }

  @Get('permissions/:waId')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Verifica a permissão de chamada de saída de um cliente (BSUID wa_id)' })
  callPermission(@Param('waId') waId: string) {
    return this.callingService.getCallPermission(waId);
  }
}