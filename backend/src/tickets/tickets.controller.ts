import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { TicketService } from './services/ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddArticleDto } from './dto/add-article.dto';
import { ChangeStateDto } from './dto/change-state.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { TicketVisibilityGuard } from './guards/ticket-visibility.guard';
import { SearchService } from '../search/search.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../iam/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly searchService: SearchService
  ) {}

  @Get()
  async getTickets(@Request() req: AuthenticatedRequest) {
    return this.ticketService.findAll(req.user);
  }

  @Get('stats')
  async getStats() {
    return this.ticketService.getDashboardStats();
  }

  @Get('search')
  async searchTickets(@Request() req: AuthenticatedRequest) {
    const q = req.query.q as string;
    if (!q) return [];
    return this.searchService.searchTickets(q);
  }

  @Get(':id')
  @UseGuards(TicketVisibilityGuard)
  async getTicket(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    return this.ticketService.findOne(id, req.user);
  }

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Request() req: AuthenticatedRequest) {
    const { initial_article_body, custom_fields, ...ticketData } = createTicketDto;
    
    // Ler o customer_id logado
    if (!ticketData.customer_id) ticketData.customer_id = req.user.id;
    if (!ticketData.group_id) ticketData.group_id = 1;
    if (!ticketData.state_id) ticketData.state_id = 2;
    return this.ticketService.createTicket(ticketData, initial_article_body, custom_fields);
  }

  @Post(':id/articles')
  @UseGuards(TicketVisibilityGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/whatsapp',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async addArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() addArticleDto: AddArticleDto,
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file?: any,
  ) {
    const isInternal = addArticleDto.is_internal === true;
    let attachments: any[] = [];
    if (file) {
      attachments = [{
        url: `/uploads/whatsapp/${file.filename}`,
        mimetype: file.mimetype,
        filename: file.originalname,
        localPath: file.path // Used for WhatsApp sending
      }];
    }
    return this.ticketService.addArticle(id, addArticleDto.body ?? '', addArticleDto.type || 'note', isInternal, req.user.id, attachments);
  }

  @Patch(':id/state')
  @UseGuards(TicketVisibilityGuard)
  async changeState(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStateDto: ChangeStateDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketService.changeState(id, changeStateDto.state_id, req.user.id);
  }

  @Patch(':id/assign')
  @UseGuards(TicketVisibilityGuard)
  async assignTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignTicketDto: AssignTicketDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketService.assignTicket(id, assignTicketDto.owner_id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(TicketVisibilityGuard)
  async deleteTicket(@Param('id', ParseIntPipe) id: number) {
    await this.ticketService.softDeleteTicket(id);
    return { success: true, message: 'Ticket deleted logically' };
  }

  @Patch(':id/title')
  @UseGuards(TicketVisibilityGuard)
  async changeTitle(
    @Param('id', ParseIntPipe) id: number,
    @Body('title') title: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketService.changeTitle(id, title, req.user.id);
  }

  @Patch(':id/service-type')
  @UseGuards(TicketVisibilityGuard)
  async changeServiceType(
    @Param('id', ParseIntPipe) id: number,
    @Body('service_type') serviceType: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketService.changeServiceType(id, serviceType, req.user.id);
  }

  @Post(':id/merge')
  @UseGuards(TicketVisibilityGuard)
  async mergeTickets(
    @Param('id', ParseIntPipe) id: number,
    @Body('target_ticket_id', ParseIntPipe) targetTicketId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.ticketService.mergeTickets(id, targetTicketId, req.user.id);
    return { success: true, message: 'Ticket merged successfully' };
  }

  @Post(':id/subtickets')
  @UseGuards(TicketVisibilityGuard)
  async createSubticket(
    @Param('id', ParseIntPipe) id: number,
    @Body('title') title: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const subticket = await this.ticketService.createSubticket(id, req.user.id, title);
    return subticket;
  }

  @Post(':id/links')
  @UseGuards(TicketVisibilityGuard)
  async linkTickets(
    @Param('id', ParseIntPipe) id: number,
    @Body('target_ticket_id', ParseIntPipe) targetTicketId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const link = await this.ticketService.linkTickets(id, targetTicketId, req.user.id);
    return link;
  }

  @Post(':id/transfer')
  @UseGuards(TicketVisibilityGuard)
  async transferTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() transferDto: TransferTicketDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const ticket = await this.ticketService.transferTicket(
      id,
      transferDto.group_id,
      transferDto.owner_id || null,
      transferDto.note,
      req.user.id,
    );
    return ticket;
  }

  @Get(':id/links')
  @UseGuards(TicketVisibilityGuard)
  async getLinks(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.getLinks(id);
  }
}
