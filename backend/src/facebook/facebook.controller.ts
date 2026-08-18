import { Controller, Get, Post, Query, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FacebookService } from './facebook.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Get('webhook')
  async verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && (await this.facebookService.verifyWebhook(verifyToken))) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification failed');
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.facebookService.handleWebhook(body);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'agent')
  send(@Body() body: { recipient_id: string; text: string }) {
    return this.facebookService.sendMessage(body.recipient_id, body.text);
  }
}
