import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CtiService } from './cti.service';
import { CreateCtiLogDto } from './dto/cti-log.dto';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('cti')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CtiController {
  constructor(private readonly ctiService: CtiService) {}

  @Get()
  @Roles('admin', 'agent')
  list() {
    return this.ctiService.listLogs();
  }

  @Post('incoming')
  @Roles('admin', 'agent')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  incoming(@Body() payload: { direction?: string; from: string; to: string; call_id?: string; queue?: string }) {
    return this.ctiService.incomingCall(payload);
  }

  @Post()
  @Roles('admin', 'agent')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  create(@Body() data: CreateCtiLogDto) {
    return this.ctiService.createLog(data);
  }

  @Patch(':id/done')
  @Roles('admin', 'agent')
  markDone(@Param('id') id: string, @Body() body: { comment?: string }) {
    return this.ctiService.markDone(+id, body?.comment);
  }
}
