import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TimeAccountingService } from './time-accounting.service';
import { CreateTimeAccountingDto, UpdateTimeAccountingDto } from './dto/time-accounting.dto';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../iam/interfaces/authenticated-request.interface';

@Controller('time-accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeAccountingController {
  constructor(private readonly timeAccountingService: TimeAccountingService) {}

  @Get('ticket/:ticketId')
  @Roles('admin', 'agent', 'customer')
  listByTicket(@Param('ticketId') ticketId: string) {
    return this.timeAccountingService.listByTicket(+ticketId);
  }

  @Get('me')
  @Roles('admin', 'agent')
  listByUser(@Req() req: AuthenticatedRequest) {
    return this.timeAccountingService.listByUser(req.user?.id);
  }

  @Post()
  @Roles('admin', 'agent')
  create(@Body() data: CreateTimeAccountingDto, @Req() req: AuthenticatedRequest) {
    return this.timeAccountingService.create({ ...data, user_id: req.user?.id });
  }

  @Patch(':id')
  @Roles('admin', 'agent')
  update(@Param('id') id: string, @Body() data: UpdateTimeAccountingDto) {
    return this.timeAccountingService.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin', 'agent')
  remove(@Param('id') id: string) {
    return this.timeAccountingService.remove(+id);
  }
}
