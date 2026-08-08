import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';

@Controller('csat')
export class CsatController {
  constructor(private readonly ticketService: TicketService) {}

  @Get(':token')
  async getCsatTicket(@Param('token') token: string) {
    try {
      const ticket = await this.ticketService.getTicketByCsatToken(token);
      return {
        id: ticket.id,
        title: ticket.title,
        agent: ticket.owner ? ticket.owner.firstname || ticket.owner.login : 'Agente',
        alreadyAnswered: ticket.satisfaction_score !== null,
        score: ticket.satisfaction_score
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post(':token')
  async submitCsat(
    @Param('token') token: string,
    @Body() body: { score: number; comment?: string }
  ) {
    try {
      if (!body.score || body.score < 1 || body.score > 5) {
        throw new Error('Nota inválida. Deve ser de 1 a 5.');
      }
      const ticket = await this.ticketService.submitCsat(token, body.score, body.comment);
      return { success: true, message: 'Pesquisa respondida com sucesso.' };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
