import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService, AiConfig } from './ai.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('tickets/:id/summarize')
  @ApiOperation({ summary: 'Gera resumo inteligente do histórico do ticket' })
  async summarize(@Param('id') id: string) {
    return this.aiService.summarizeTicket(+id);
  }

  @Post('tickets/:id/suggest-reply')
  @ApiOperation({ summary: 'Gera sugestão de resposta cordial para o chamado' })
  async suggestReply(@Param('id') id: string) {
    return this.aiService.suggestReply(+id);
  }

  @Post('test-connection')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Testa a conexão e credenciais com o provedor de IA' })
  async testConnection(@Body() body: Partial<AiConfig>) {
    return this.aiService.testConnection(body);
  }
}
