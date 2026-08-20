import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappCallingService } from './whatsapp-calling.service';
import { UpdateCallSettingsDto } from './dto/update-call-settings.dto';
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
}