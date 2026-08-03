import { Controller, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TicketService } from './services/ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddArticleDto } from './dto/add-article.dto';
import { ChangeStateDto } from './dto/change-state.dto';
import { TicketVisibilityGuard } from './guards/ticket-visibility.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    const { initial_article_body, ...ticketData } = createTicketDto;
    return this.ticketService.createTicket(ticketData, initial_article_body);
  }

  @Post(':id/articles')
  @UseGuards(TicketVisibilityGuard)
  async addArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() addArticleDto: AddArticleDto,
  ) {
    return this.ticketService.addArticle(id, addArticleDto.body, addArticleDto.type);
  }

  @Patch(':id/state')
  @UseGuards(TicketVisibilityGuard)
  async changeState(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStateDto: ChangeStateDto,
  ) {
    return this.ticketService.changeState(id, changeStateDto.state_id);
  }

  @Delete(':id')
  @UseGuards(TicketVisibilityGuard)
  async deleteTicket(@Param('id', ParseIntPipe) id: number) {
    await this.ticketService.softDeleteTicket(id);
    return { success: true, message: 'Ticket deleted logically' };
  }
}
