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
import * as fs from 'fs';
import * as path from 'path';

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

  async handleIncomingMessage(fromPhone: string, profileName: string, text: string, phoneNumberId: string, media?: any) {
    this.logger.log(`Received WhatsApp message from ${fromPhone}: ${text} (Media: ${!!media})`);

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

    let attachments = [];
    if (media && media.id) {
      attachments = await this.downloadMedia(media);
    }

    if (activeTicket) {
      // Add article to existing ticket
      await this.ticketService.addArticle(activeTicket.id, text, 'whatsapp', false, user.id, attachments);
      
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
      
      await this.ticketService.createTicket(ticketData, text, [], attachments);
    }
  }

  private async downloadMedia(media: any): Promise<any[]> {
    try {
      const token = await this.settingsService.getSetting('whatsapp_token');
      if (!token) return [];

      // 1. Get Media URL
      const mediaInfoUrl = `https://graph.facebook.com/v19.0/${media.id}`;
      const infoResponse = await firstValueFrom(this.httpService.get(mediaInfoUrl, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      
      const downloadUrl = infoResponse.data.url;
      const mimeType = infoResponse.data.mime_type || media.mime_type;
      
      // 2. Download binary data
      const downloadResponse = await firstValueFrom(this.httpService.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }));

      // 3. Save locally
      const uploadDir = path.join(process.cwd(), 'uploads', 'whatsapp');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const extension = mimeType.split('/')[1]?.split(';')[0] || 'bin';
      const filename = `${media.id}_${Date.now()}.${extension}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, Buffer.from(downloadResponse.data));

      return [{
        url: `/uploads/whatsapp/${filename}`,
        mimetype: mimeType,
        filename: filename
      }];
    } catch (error) {
      this.logger.error(`Failed to download WhatsApp media ${media.id}`, error);
      return [];
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

  async sendMediaMessage(toPhone: string, text: string, filePath: string, mimeType: string, filename: string) {
    const token = await this.settingsService.getSetting('whatsapp_token');
    const phoneId = await this.settingsService.getSetting('whatsapp_phone_id');

    if (!token || !phoneId) {
      this.logger.warn('WhatsApp token or phone ID not configured.');
      return;
    }

    try {
      // 1. Upload media to WhatsApp API
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('type', mimeType);
      formData.append('messaging_product', 'whatsapp');

      const uploadUrl = `https://graph.facebook.com/v19.0/${phoneId}/media`;
      const uploadResponse = await firstValueFrom(
        this.httpService.post(uploadUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        })
      );
      const mediaId = uploadResponse.data.id;

      // 2. Send the message with the media
      let messageType = 'document';
      if (mimeType.startsWith('image/')) messageType = 'image';
      else if (mimeType.startsWith('video/')) messageType = 'video';
      else if (mimeType.startsWith('audio/')) messageType = 'audio';

      const messageUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      const messageBody: any = {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: messageType,
      };

      messageBody[messageType] = { id: mediaId };
      if (text && messageType !== 'audio') {
        messageBody[messageType].caption = text;
      }
      if (messageType === 'document') {
        messageBody[messageType].filename = filename;
      }

      await firstValueFrom(this.httpService.post(messageUrl, messageBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }));
      this.logger.log(`WhatsApp media message sent to ${toPhone}`);
      
      // se houver texto num áudio, envia o texto como mensagem separada
      if (text && messageType === 'audio') {
        await this.sendMessage(toPhone, text);
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp media to ${toPhone}:`, error.response?.data || error.message);
    }
  }
}
