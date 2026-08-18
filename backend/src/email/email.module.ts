import { Module, forwardRef } from '@nestjs/common';
import { SmtpService } from './services/smtp.service';
import { ImapService } from './services/imap.service';
import { Pop3Service } from './services/pop3.service';
import { MicrosoftGraphService } from './services/microsoft-graph.service';
import { EmailProcessorService } from './services/email-processor.service';
import { TicketsModule } from '../tickets/tickets.module';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [forwardRef(() => TicketsModule), forwardRef(() => IamModule)],
  providers: [SmtpService, ImapService, Pop3Service, MicrosoftGraphService, EmailProcessorService],
  exports: [SmtpService, ImapService, Pop3Service, MicrosoftGraphService],
})
export class EmailModule {}
