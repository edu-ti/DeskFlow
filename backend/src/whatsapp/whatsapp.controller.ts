import { Controller, Get, Post, Body, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { SettingsService } from '../settings/services/settings.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly settingsService: SettingsService
  ) {}

  @Get('webhook')
  async verifyWebhook(@Req() req: Request, @Res() res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = await this.settingsService.getSetting('whatsapp_verify_token', 'deskflow_whatsapp_2026');

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK_VERIFIED');
        res.status(HttpStatus.OK).send(challenge);
      } else {
        res.sendStatus(HttpStatus.FORBIDDEN);
      }
    } else {
      res.sendStatus(HttpStatus.BAD_REQUEST);
    }
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response) {
    try {
      if (body.object) {
        if (
          body.entry &&
          body.entry[0].changes &&
          body.entry[0].changes[0] &&
          body.entry[0].changes[0].value.messages &&
          body.entry[0].changes[0].value.messages[0]
        ) {
          const message = body.entry[0].changes[0].value.messages[0];
          const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
          const from = message.from; // sender's phone number
          const type = message.type;
          
          let msgBody = '';
          let media = null;

          if (type === 'text') {
            msgBody = message.text?.body;
          } else if (['image', 'audio', 'video', 'document'].includes(type)) {
            media = message[type];
            msgBody = media.caption || `[Mídia recebida: ${type}]`;
          }
          
          const contacts = body.entry[0].changes[0].value.contacts;
          const profileName = contacts && contacts[0] ? contacts[0].profile.name : 'Unknown';

          if (msgBody || media) {
            await this.whatsappService.handleIncomingMessage(from, profileName, msgBody, phoneNumberId, media);
          }
        }
        res.sendStatus(HttpStatus.OK);
      } else {
        res.sendStatus(HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
      res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
