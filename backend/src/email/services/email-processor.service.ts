import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ParsedMail } from 'mailparser';
import { TicketService } from '../../tickets/services/ticket.service';
import { IamService } from '../../iam/services/iam.service';

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);

  constructor(
    @Inject(forwardRef(() => TicketService))
    private ticketService: TicketService,
    @Inject(forwardRef(() => IamService))
    private iamService: IamService,
  ) {}

  async processEmail(mail: ParsedMail) {
    this.logger.log(`Processing email: ${mail.subject}`);
    // Extract sender email
    const senderEmail = mail.from?.value[0]?.address;
    const senderName = mail.from?.value[0]?.name;
    
    if (!senderEmail) {
      this.logger.warn('No sender email found, skipping');
      return;
    }

    // Check if it's a reply to an existing ticket. Ex: [Ticket #123]
    const subject = mail.subject || 'Sem Assunto';
    const match = subject.match(/\[Ticket #(\d+)\]/i);

    let customerId: number;

    // Find or create user in IAM Service
    let user = await this.iamService.findUserByEmail(senderEmail);
    if (!user) {
      user = await this.iamService.createUser({
        email: senderEmail,
        login: senderEmail,
        firstname: senderName || senderEmail.split('@')[0],
      });
      this.logger.log(`Created new user for email sender: ${senderEmail}`);
    }
    customerId = user.id;

    const emailBody = mail.text || mail.html || 'Sem conteúdo';

    if (match) {
      const ticketId = parseInt(match[1]);
      try {
        const ticket = await this.ticketService.findOne(ticketId, { roles: ['admin'] });
        if (ticket) {
          await this.ticketService.addArticle(ticketId, emailBody, 'email', false, customerId);
          // Re-open ticket if it was closed
          if (ticket.state_id === 4) { // Assuming 4 is closed
            await this.ticketService.changeState(ticketId, 1, customerId); // 1 = open
          }
          this.logger.log(`Added email reply to ticket #${ticketId}`);
        }
      } catch (err) {
        this.logger.error(`Ticket #${ticketId} not found or error adding reply`, err);
        // Fallback to new ticket
        await this.createNewTicket(subject, emailBody, customerId);
      }
    } else {
      await this.createNewTicket(subject, emailBody, customerId);
    }
  }

  private async createNewTicket(subject: string, body: string, customerId: number) {
    const ticket = await this.ticketService.createTicket(
      {
        title: subject,
        customer_id: customerId,
        state_id: 1, // Open
      },
      body
    );
    this.logger.log(`Created new ticket #${ticket.id} from email`);
  }
}
