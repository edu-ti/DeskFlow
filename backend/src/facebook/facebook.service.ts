import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/services/settings.service';
import axios from 'axios';
import { GRAPH_API_BASE } from '../common/graph-api.constants';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private async getPageToken(): Promise<string | undefined> {
    return this.settingsService.getSetting('FACEBOOK_PAGE_TOKEN') || process.env.FACEBOOK_PAGE_TOKEN;
  }

  async verifyWebhook(token: string): Promise<boolean> {
    const verify = (await this.settingsService.getSetting('FACEBOOK_VERIFY_TOKEN')) || process.env.FACEBOOK_VERIFY_TOKEN;
    return !!verify && token === verify;
  }

  async sendMessage(recipientId: string, text: string): Promise<any> {
    const token = await this.getPageToken();
    if (!token) {
      return { skipped: true, reason: 'facebook_not_configured' };
    }
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messages?access_token=${token}`,
      { recipient: { id: recipientId }, message: { text } },
    );
    return response.data;
  }

  async handleWebhook(body: any): Promise<void> {
    if (body?.object !== 'page') {
      return;
    }
    for (const entry of body.entry || []) {
      for (const messaging of entry.messaging || []) {
        if (messaging.message) {
          this.logger.log(`Facebook inbound from ${messaging.sender?.id}: ${messaging.message.text}`);
          // Inbound messages can be routed to ticket creation here (integration point).
        }
      }
    }
  }
}
