import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get('ticket/:ticketId')
  @Roles('admin', 'agent', 'customer')
  getTicketChecklist(@Param('ticketId') ticketId: string) {
    return this.checklistsService.getTicketChecklist(+ticketId);
  }

  @Post('ticket/:ticketId')
  @Roles('admin', 'agent')
  ensure(@Param('ticketId') ticketId: string, @Body() body: { name?: string }) {
    return this.checklistsService.ensureChecklist(+ticketId, body?.name);
  }

  @Post('ticket/:ticketId/items')
  @Roles('admin', 'agent')
  addItem(@Param('ticketId') ticketId: string, @Body() body: { text: string }) {
    return this.checklistsService.addItem(+ticketId, body.text);
  }

  @Patch('items/:itemId/toggle')
  @Roles('admin', 'agent')
  toggle(@Param('itemId') itemId: string) {
    return this.checklistsService.toggleItem(+itemId);
  }

  @Patch('items/:itemId')
  @Roles('admin', 'agent')
  updateItem(@Param('itemId') itemId: string, @Body() data: any) {
    return this.checklistsService.updateItem(+itemId, data);
  }

  @Delete('items/:itemId')
  @Roles('admin', 'agent')
  removeItem(@Param('itemId') itemId: string) {
    return this.checklistsService.removeItem(+itemId);
  }

  @Delete(':checklistId')
  @Roles('admin', 'agent')
  removeChecklist(@Param('checklistId') checklistId: string) {
    return this.checklistsService.removeChecklist(+checklistId);
  }
}
