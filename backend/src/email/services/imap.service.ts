import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailProcessorService } from './email-processor.service';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(
    private configService: ConfigService,
    private emailProcessor: EmailProcessorService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchEmails() {
    // Basic config check
    if (!this.configService.get('IMAP_HOST')) {
      this.logger.warn('IMAP_HOST not configured, skipping IMAP fetch');
      return;
    }

    const client = new ImapFlow({
      host: this.configService.get<string>('IMAP_HOST') as string,
      port: this.configService.get<number>('IMAP_PORT', 993),
      secure: this.configService.get<boolean>('IMAP_TLS', true),
      auth: {
        user: this.configService.get<string>('IMAP_USER') as string,
        pass: this.configService.get<string>('IMAP_PASS') as string,
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
      await client.logout();
    }
  }
}
