import { Module, forwardRef } from '@nestjs/common';
import { SmtpService } from './services/smtp.service';
import { ImapService } from './services/imap.service';
import { EmailProcessorService } from './services/email-processor.service';
import { TicketsModule } from '../tickets/tickets.module';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [forwardRef(() => TicketsModule), forwardRef(() => IamModule)],
  providers: [SmtpService, ImapService, EmailProcessorService],
  exports: [SmtpService],
})
export class EmailModule {}
