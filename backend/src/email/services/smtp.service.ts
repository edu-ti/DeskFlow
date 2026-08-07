import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../iam/entities/user.entity';
import { Article } from '../../tickets/entities/article.entity';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 465),
      secure: this.configService.get<boolean>('SMTP_SECURE', true),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const from = this.configService.get<string>('SMTP_FROM');
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Message sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}`, error);
    }
  }

  async sendTicketCreatedEmail(ticket: Ticket, customer: User) {
    if (!customer.email) return;
    
    const subject = `[Ticket #${ticket.id}] Seu chamado foi criado: ${ticket.title}`;
    const text = `Olá ${customer.firstname || customer.login},\n\nRecebemos o seu chamado #${ticket.id} (${ticket.title}).\nNossa equipe irá analisá-lo e retornará em breve.\n\nAtenciosamente,\nEquipe de Suporte DeskFlow`;
    
    await this.sendMail(customer.email, subject, text);
  }

  async sendTicketReplyEmail(ticket: Ticket, article: Article, customer: User) {
    if (!customer.email) return;

    const subject = `[Ticket #${ticket.id}] Atualização: ${ticket.title}`;
    const text = `Olá ${customer.firstname || customer.login},\n\nHá uma nova atualização no seu chamado #${ticket.id}.\n\n------------------------\n${article.body}\n------------------------\n\nResponda a este e-mail para adicionar um comentário.\n\nAtenciosamente,\nEquipe de Suporte DeskFlow`;

    await this.sendMail(customer.email, subject, text);
  }
}
