import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('tickets/:id/summarize')
  async summarize(@Param('id') id: string) {
    return this.aiService.summarizeTicket(+id);
  }

  @Post('tickets/:id/suggest-reply')
  async suggestReply(@Param('id') id: string) {
    return this.aiService.suggestReply(+id);
  }
}
