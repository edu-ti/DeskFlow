import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../iam/entities/user.entity';
import { Article } from '../../tickets/entities/article.entity';
import { SettingsService } from '../../settings/services/settings.service';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    const host = (await this.settingsService.getSetting('SMTP_HOST')) || this.configService.get('SMTP_HOST');
    const port = parseInt((await this.settingsService.getSetting('SMTP_PORT')) || this.configService.get('SMTP_PORT') || '465');
    const secure = (await this.settingsService.getSetting('SMTP_SECURE')) === 'true' || this.configService.get<boolean>('SMTP_SECURE', true);
    const user = (await this.settingsService.getSetting('SMTP_USER')) || this.configService.get('SMTP_USER');
    const pass = (await this.settingsService.getSetting('SMTP_PASS')) || this.configService.get('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuraton missing in DB or .env');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const transporter = await this.getTransporter();
    if (!transporter) return;

    const from = (await this.settingsService.getSetting('SMTP_FROM')) || this.configService.get<string>('SMTP_FROM');
    try {
      const info = await transporter.sendMail({
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

  async sendCsatEmail(ticket: Ticket, customer: User) {
    if (!customer.email || !ticket.csat_token) return;

    const subject = `[Ticket #${ticket.id}] Como foi nosso atendimento?`;
    // TODO: Usar variável de ambiente para a URL do frontend
    const baseUrl = 'http://localhost:5173/#/csat';
    const link = `${baseUrl}/${ticket.csat_token}`;

    const text = `Olá ${customer.firstname || customer.login},\n\nO seu chamado #${ticket.id} foi resolvido.\nPor favor, reserve um minuto para nos dizer como foi o atendimento clicando no link abaixo:\n\n${link}\n\nAtenciosamente,\nEquipe de Suporte DeskFlow`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Como foi nosso atendimento?</h2>
        <p>Olá ${customer.firstname || customer.login},</p>
        <p>O seu chamado <strong>#${ticket.id} (${ticket.title})</strong> foi marcado como resolvido.</p>
        <p>Sua opinião é muito importante para nós! Por favor, avalie o atendimento que você recebeu:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${link}?score=1" style="text-decoration: none; font-size: 30px; margin: 0 5px;">⭐</a>
          <a href="${link}?score=2" style="text-decoration: none; font-size: 30px; margin: 0 5px;">⭐</a>
          <a href="${link}?score=3" style="text-decoration: none; font-size: 30px; margin: 0 5px;">⭐</a>
          <a href="${link}?score=4" style="text-decoration: none; font-size: 30px; margin: 0 5px;">⭐</a>
          <a href="${link}?score=5" style="text-decoration: none; font-size: 30px; margin: 0 5px;">⭐</a>
        </div>

        <p style="text-align: center; margin-top: 10px;">
          <a href="${link}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Acessar página de avaliação
          </a>
        </p>
        
        <br />
        <p style="font-size: 12px; color: #666;">Se você não solicitou este chamado, por favor ignore este e-mail.</p>
      </div>
    `;

    await this.sendMail(customer.email, subject, text, html);
  }
}
