import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PublicLinksService } from './public-links.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('public-links')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublicLinksController {
  constructor(private readonly publicLinksService: PublicLinksService) {}

  @Get('ticket/:ticketId')
  @Roles('admin', 'agent')
  listByTicket(@Param('ticketId') ticketId: string) {
    return this.publicLinksService.listByTicket(+ticketId);
  }

  @Post('ticket/:ticketId')
  @Roles('admin', 'agent')
  create(@Param('ticketId') ticketId: string, @Body() body: { expires_at?: string }) {
    return this.publicLinksService.create(+ticketId, body?.expires_at ? new Date(body.expires_at) : undefined);
  }

  @Delete(':id')
  @Roles('admin', 'agent')
  revoke(@Param('id') id: string) {
    return this.publicLinksService.revoke(+id);
  }
}

@Controller('public')
export class PublicTicketController {
  constructor(private readonly publicLinksService: PublicLinksService) {}

  @Get('tickets/:token')
  findTicket(@Param('token') token: string) {
    return this.publicLinksService.findTicketByToken(token);
  }
}
