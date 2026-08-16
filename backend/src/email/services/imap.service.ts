import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailProcessorService } from './email-processor.service';
import { SettingsService } from '../../settings/services/settings.service';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
    private emailProcessor: EmailProcessorService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchEmails() {
    // Fetch IMAP settings from DB or fallback to .env
    const imapHost = (await this.settingsService.getSetting('IMAP_HOST')) || this.configService.get('IMAP_HOST');
    const imapPort = parseInt((await this.settingsService.getSetting('IMAP_PORT')) || this.configService.get('IMAP_PORT') || '993');
    const imapTls = (await this.settingsService.getSetting('IMAP_TLS')) === 'true' || this.configService.get<boolean>('IMAP_TLS', true);
    const imapUser = (await this.settingsService.getSetting('IMAP_USER')) || this.configService.get('IMAP_USER');
    const imapPass = (await this.settingsService.getSetting('IMAP_PASS')) || this.configService.get('IMAP_PASS');

    if (!imapHost || !imapUser || !imapPass || imapHost === 'imap.example.com') {
      return;
    }

    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapTls,
      auth: {
        user: imapUser,
        pass: imapPass,
      },
      logger: false,
    });

    try {
      await client.connect();
      this.logger.log('Connected to IMAP server');

      const lock = await client.getMailboxLock('INBOX');
      try {
        // Fetch unseen messages
        const messages = client.fetch({ seen: false }, { source: true });
        
        for await (const message of messages) {
          const source = (message as any).source;
          const parsedMail = await simpleParser(source) as ParsedMail;
          this.logger.log(`Fetched email: ${parsedMail.subject} from ${parsedMail.from?.text}`);
          
          await this.emailProcessor.processEmail(parsedMail);
          
          // Mark as seen
          await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen'], { uid: true });
        }
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error('Error fetching emails', error);
    } finally {
      try {
        if (client.usable) {
          await client.logout();
        }
      } catch (_) {}
    }
  }
}
