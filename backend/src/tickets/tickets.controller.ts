import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { TicketService } from './services/ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddArticleDto } from './dto/add-article.dto';
import { ChangeStateDto } from './dto/change-state.dto';
import { TicketVisibilityGuard } from './guards/ticket-visibility.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  async getTickets() {
    return this.ticketService.findAll();
  }

  @Get(':id')
  @UseGuards(TicketVisibilityGuard)
  async getTicket(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findOne(id);
  }

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    const { initial_article_body, ...ticketData } = createTicketDto;
    
    // Ler o customer_id logado
    if (!ticketData.customer_id) ticketData.customer_id = req.user.id;
    if (!ticketData.group_id) ticketData.group_id = 1;
    if (!ticketData.state_id) ticketData.state_id = 1;
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
