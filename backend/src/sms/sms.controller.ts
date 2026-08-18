import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @Roles('admin', 'agent')
  send(@Body() body: { to: string; message: string }) {
    return this.smsService.sendSms(body.to, body.message);
  }
}
