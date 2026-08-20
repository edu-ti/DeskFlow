import { Controller, Get, Post, Body, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { WhatsappCallingService } from './whatsapp-calling.service';
import { SettingsService } from '../settings/services/settings.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly whatsappCallingService: WhatsappCallingService,
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

  @Post('simulate')
  async simulateIncomingMessage(@Body() body: { from?: string; name?: string; text?: string; phone_number_id?: string }) {
    const from = body.from || '5511999998888';
    const name = body.name || 'Cliente Teste WhatsApp';
    const text = body.text || 'Olá! Gostaria de tirar uma dúvida pelo WhatsApp.';
    const phoneNumberId = body.phone_number_id || 'test_phone_number_id';

    await this.whatsappService.handleIncomingMessage(from, name, text, phoneNumberId);
    return { success: true, message: 'Simulated WhatsApp message processed successfully', data: { from, name, text } };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response) {
    try {
      if (body.object) {
        if (
          body.entry &&
          body.entry[0].changes &&
          body.entry[0].changes[0]
        ) {
          const change = body.entry[0].changes[0];

          // Eventos de chamada (Calling API)
          if (change.field === 'calls' && change.value?.calls?.length) {
            await this.whatsappCallingService.handleCallWebhook(change.value);
            return res.sendStatus(HttpStatus.OK);
          }

          if (
            change.value.messages &&
            change.value.messages[0]
          ) {
            const message = change.value.messages[0];
            const phoneNumberId = change.value.metadata.phone_number_id;
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
            
            const contacts = change.value.contacts;
            const profileName = contacts && contacts[0] ? contacts[0].profile.name : 'Unknown';

            if (msgBody || media) {
              await this.whatsappService.handleIncomingMessage(from, profileName, msgBody, phoneNumberId, media);
            }
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
