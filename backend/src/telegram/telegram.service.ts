import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/services/settings.service';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private async getToken(): Promise<string | undefined> {
    return this.settingsService.getSetting('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN;
  }

  async sendMessage(chatId: string, text: string): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      return { skipped: true, reason: 'telegram_not_configured' };
    }
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });
    return response.data;
  }

  async handleWebhook(update: any): Promise<void> {
    // Normalize update -> message
    const message = update?.message || update?.edited_message;
    if (!message) {
      return;
    }
    const chatId = message?.chat?.id;
    const text = message?.text;
    this.logger.log(`Telegram inbound from ${chatId}: ${text}`);
    // Inbound messages can be routed to ticket creation by emitting an event here.
    // (integration point)
  }
}
