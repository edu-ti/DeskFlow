import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TimeAccountingService } from './time-accounting.service';
import { TimeAccounting } from './entities/time-accounting.entity';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

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
  listByUser(@Req() req: any) {
    return this.timeAccountingService.listByUser(req.user?.id);
  }

  @Post()
  @Roles('admin', 'agent')
  create(@Body() data: Partial<TimeAccounting>, @Req() req: any) {
    return this.timeAccountingService.create({ ...data, user_id: req.user?.id });
  }

  @Patch(':id')
  @Roles('admin', 'agent')
  update(@Param('id') id: string, @Body() data: Partial<TimeAccounting>) {
    return this.timeAccountingService.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin', 'agent')
  remove(@Param('id') id: string) {
    return this.timeAccountingService.remove(+id);
  }
}
