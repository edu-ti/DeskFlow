import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from '../../settings/services/settings.service';

@Injectable()
export class Pop3Service {
  private readonly logger = new Logger(Pop3Service.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchEmails() {
    const host = (await this.settingsService.getSetting('POP3_HOST')) || this.configService.get('POP3_HOST');
    const user = (await this.settingsService.getSetting('POP3_USER')) || this.configService.get('POP3_USER');
    const pass = (await this.settingsService.getSetting('POP3_PASS')) || this.configService.get('POP3_PASS');

    if (!host || !user || !pass || host === 'pop.example.com') {
      return;
    }

    // POP3 is largely superseded by IMAP. This service is a config-driven
    // placeholder: wire a POP3 client library here if a legacy mailbox is required.
    this.logger.warn('POP3 fetching requested but not implemented (use IMAP or Microsoft Graph instead)');
  }
}
