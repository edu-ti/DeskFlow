import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../iam/entities/user.entity';
import { Role } from '../iam/entities/role.entity';
import { TicketService } from '../tickets/services/ticket.service';
import { SettingsService } from '../settings/services/settings.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @Inject(forwardRef(() => TicketService))
    private readonly ticketService: TicketService,
    private readonly settingsService: SettingsService,
    private readonly httpService: HttpService,
  ) {}

  async handleIncomingMessage(fromPhone: string, profileName: string, text: string, phoneNumberId: string) {
    this.logger.log(`Received WhatsApp message from ${fromPhone}: ${text}`);

    // 1. Find or create user
    let user = await this.userRepository.findOne({ where: { phone: fromPhone } });
    if (!user) {
      // Create new customer user
      const tempEmail = `${fromPhone}@whatsapp.local`;
      const passwordHash = await bcrypt.hash(fromPhone + process.env.JWT_SECRET, 10);
      const customerRole = await this.roleRepository.findOne({ where: { name: 'customer' } });
      const roles = customerRole ? [customerRole] : [];
      
      user = this.userRepository.create({
        login: fromPhone,
        firstname: profileName.split(' ')[0] || 'Cliente',
        lastname: profileName.split(' ').slice(1).join(' ') || 'WhatsApp',
        email: tempEmail,
        phone: fromPhone,
        password_hash: passwordHash,
        roles
      });
      user = await this.userRepository.save(user);
    }

    // 2. Find active ticket for this user from WhatsApp
    // Active states: 1(Triagem), 2(Aberto), 3(Em Atendimento), 4(Pendente), 6(Dúvida)
    // 5(Resolvido) means closed, so we create a new one.
    const activeTicket = await this.ticketService['ticketRepository'].findOne({
      where: {
        customer_id: user.id,
        source: 'whatsapp',
        state_id: In([1, 2, 3, 4, 6])
      },
      order: { created_at: 'DESC' }
    });

    if (activeTicket) {
      // Add article to existing ticket
      await this.ticketService.addArticle(activeTicket.id, text, 'whatsapp', false, user.id);
      
      // Se estava pendente(4) ou dúvida(6), volta para Aberto(2) ou Em Atendimento(3).
      // Por enquanto vamos colocar Aberto(2).
      if (activeTicket.state_id === 4 || activeTicket.state_id === 6) {
        await this.ticketService.changeState(activeTicket.id, 2, user.id);
      }
    } else {
      // Create new ticket
      const ticketData = {
        title: `Atendimento WhatsApp - ${profileName}`,
        customer_id: user.id,
        group_id: 1, // default group
        priority_id: 2, // medium
        state_id: 1, // Triagem for new WhatsApp tickets
        source: 'whatsapp'
      };
      
      await this.ticketService.createTicket(ticketData, text);
    }
  }

  async sendMessage(toPhone: string, text: string) {
    const token = await this.settingsService.getSetting('whatsapp_token');
    const phoneId = await this.settingsService.getSetting('whatsapp_phone_id');

    if (!token || !phoneId) {
      this.logger.warn('WhatsApp token or phone ID not configured.');
      return;
    }

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    
    try {
      await firstValueFrom(this.httpService.post(url, {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: text }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }));
      this.logger.log(`WhatsApp message sent to ${toPhone}`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${toPhone}:`, error.response?.data || error.message);
    }
  }
}
