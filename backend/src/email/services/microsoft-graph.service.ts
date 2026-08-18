import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from '../../settings/services/settings.service';
import axios from 'axios';

@Injectable()
export class MicrosoftGraphService {
  private readonly logger = new Logger(MicrosoftGraphService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  private async config(key: string, envKey: string): Promise<string | undefined> {
    return (await this.settingsService.getSetting(key)) || this.configService.get(envKey);
  }

  async getAccessToken(): Promise<string | null> {
    const tenantId = await this.config('MS_GRAPH_TENANT_ID', 'MS_GRAPH_TENANT_ID');
    const clientId = await this.config('MS_GRAPH_CLIENT_ID', 'MS_GRAPH_CLIENT_ID');
    const clientSecret = await this.config('MS_GRAPH_CLIENT_SECRET', 'MS_GRAPH_CLIENT_SECRET');
    if (!tenantId || !clientId || !clientSecret) {
      return null;
    }
    try {
      const response = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      return response.data.access_token;
    } catch (err) {
      this.logger.error('Failed to obtain Microsoft Graph token', err);
      return null;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchEmails() {
    const token = await this.getAccessToken();
    if (!token) {
      return;
    }
    const mailbox = await this.config('MS_GRAPH_MAILBOX', 'MS_GRAPH_MAILBOX');
    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/${mailbox || 'me'}/mailFolders/inbox/messages`,
        {
          params: { $filter: 'isRead eq false', $top: 50 },
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const messages = response.data?.value || [];
      for (const message of messages) {
        this.logger.log(`MS Graph inbox: "${message.subject}" from ${message.from?.emailAddress?.address}`);
        // Inbound routing to EmailProcessorService is the integration point here.
      }
    } catch (err) {
      this.logger.error('Error fetching emails from Microsoft Graph', err);
    }
  }
}
