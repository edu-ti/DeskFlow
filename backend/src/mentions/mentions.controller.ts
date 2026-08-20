import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../iam/interfaces/authenticated-request.interface';

@Controller('mentions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MentionsController {
  constructor(private readonly mentionsService: MentionsService) {}

  @Get('ticket/:ticketId')
  @Roles('admin', 'agent', 'customer')
  listByTicket(@Param('ticketId') ticketId: string) {
    return this.mentionsService.listByTicket(+ticketId);
  }

  @Get('me')
  @Roles('admin', 'agent', 'customer')
  listByUser(@Req() req: AuthenticatedRequest) {
    return this.mentionsService.listByUser(req.user?.id);
  }

  @Post('ticket/:ticketId')
  @Roles('admin', 'agent')
  add(@Param('ticketId') ticketId: string, @Body() body: { user_id: number }, @Req() req: AuthenticatedRequest) {
    return this.mentionsService.addMention(+ticketId, body.user_id, req.user?.id);
  }

  @Delete('ticket/:ticketId/:userId')
  @Roles('admin', 'agent')
  remove(@Param('ticketId') ticketId: string, @Param('userId') userId: string) {
    return this.mentionsService.remove(+ticketId, +userId);
  }
}
