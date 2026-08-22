import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, IsNull } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../iam/entities/user.entity';
import { Role } from '../iam/entities/role.entity';
import { Group } from '../iam/entities/group.entity';
import { TicketService } from '../tickets/services/ticket.service';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SettingsService } from '../settings/services/settings.service';
import { AiService } from '../ai/ai.service';
import { GRAPH_API_BASE } from '../common/graph-api.constants';
import { BusinessHoursUtil } from '../sla/business-hours.util';
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
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @Inject(forwardRef(() => TicketService))
    private readonly ticketService: TicketService,
    private readonly settingsService: SettingsService,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService,
  ) {}

  async getOrCreateCustomerUser(fromPhone: string, profileName?: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { phone: fromPhone } });
    if (!user) {
      const tempEmail = `${fromPhone}@whatsapp.local`;
      const passwordHash = await bcrypt.hash(fromPhone + process.env.JWT_SECRET, 10);
      const customerRole = await this.roleRepository.findOne({ where: { name: 'customer' } });
      const roles = customerRole ? [customerRole] : [];
      user = this.userRepository.create({
        login: fromPhone,
        firstname: profileName?.split(' ')[0] || 'Cliente',
        lastname: profileName?.split(' ').slice(1).join(' ') || 'WhatsApp',
        email: tempEmail,
        phone: fromPhone,
        password_hash: passwordHash,
        roles,
      });
      user = await this.userRepository.save(user);
    }
    return user;
  }

  async findActiveWhatsAppTicket(customerId: number): Promise<Ticket | null> {
    return this.ticketService['ticketRepository'].findOne({
      where: {
        customer_id: customerId,
        source: 'whatsapp',
        state_id: In([1, 2, 3, 4, 6]),
      },
      order: { created_at: 'DESC' },
    });
  }

  async findPendingCsatTicket(customerId: number): Promise<Ticket | null> {
    return this.ticketService['ticketRepository'].findOne({
      where: {
        customer_id: customerId,
        source: 'whatsapp',
        csat_stage: In(['PENDING_RATING', 'PENDING_FEEDBACK']),
      },
      order: { updated_at: 'DESC' },
    });
  }

  /**
   * Calcula em tempo real a posição do chamado na fila do grupo.
   * Considera chamados abertos não atribuídos no mesmo grupo criados antes deste.
   */
  async getQueuePosition(ticketId: number, groupId: number): Promise<number> {
    const currentTicket = await this.ticketService['ticketRepository'].findOne({ where: { id: ticketId } });
    if (!currentTicket) return 1;

    const countBefore = await this.ticketService['ticketRepository'].count({
      where: {
        group_id: groupId,
        state_id: In([1, 2]),
        owner_id: IsNull(),
        created_at: LessThan(currentTicket.created_at),
      },
    });

    return countBefore + 1;
  }

  /**
   * Dispara a pesquisa CSAT via WhatsApp (Etapa 1: Nota 1 a 5 ou 9)
   */
  async sendCsatSurvey(ticketId: number, phone: string) {
    const ticket = await this.ticketService['ticketRepository'].findOne({ where: { id: ticketId } });
    if (!ticket) return;

    ticket.csat_stage = 'PENDING_RATING';
    await this.ticketService['ticketRepository'].save(ticket);

    const csatMenu =
      `Por favor, nos conte como foi o seu atendimento:\n\n` +
      `1. 😔 Péssimo\n` +
      `2. 🙁 Ruim\n` +
      `3. 😐 Regular\n` +
      `4. 😀 Bom\n` +
      `5. 🤩 Excelente\n` +
      `9. ❌ Não avaliar\n\n` +
      `_Digite o número correspondente à sua nota:_`;

    try {
      await this.sendMessage(phone, csatMenu);
      await this.ticketService.addArticle(
        ticket.id,
        `⭐ **Pesquisa de Satisfação (CSAT) enviada via WhatsApp.**\n\n${csatMenu}`,
        'whatsapp',
        true,
        1
      );
    } catch (err) {
      this.logger.error('Erro ao enviar pesquisa CSAT no WhatsApp', err);
    }
  }

  private async getOrCreateGroupByName(name: string): Promise<Group> {
    let group = await this.groupRepository.findOne({ where: { name } });
    if (!group) {
      group = this.groupRepository.create({ name, description: `Fila de ${name}` });
      group = await this.groupRepository.save(group);
    }
    return group;
  }

  async handleIncomingMessage(fromPhone: string, profileName: string, text: string, phoneNumberId: string, media?: any) {
    this.logger.log(`Received WhatsApp message from ${fromPhone}: ${text} (Media: ${!!media})`);
    const trimmed = (text || '').trim();

    // 1. Localiza ou cria o usuário cliente
    const user = await this.getOrCreateCustomerUser(fromPhone, profileName);

    let attachments = [];
    if (media && media.id) {
      attachments = await this.downloadMedia(media);
    }

    // 2. Verifica se o cliente está respondendo a uma pesquisa CSAT pendente
    const pendingCsatTicket = await this.findPendingCsatTicket(user.id);
    if (pendingCsatTicket) {
      await this.handleCsatResponse(pendingCsatTicket, fromPhone, trimmed);
      return;
    }

    // 3. Verifica se há chamado ativo para este cliente
    let activeTicket = await this.findActiveWhatsAppTicket(user.id);

    if (activeTicket) {
      // Adiciona o artigo ao chamado ativo
      await this.ticketService.addArticle(activeTicket.id, text, 'whatsapp', false, user.id, attachments);

      // Fluxo de URA se o chamado ainda está em Triagem (state_id = 1)
      if (activeTicket.state_id === 1) {
        if (trimmed === '#' || trimmed.toLowerCase() === 'finalizar') {
          await this.ticketService.changeState(activeTicket.id, 5, user.id);
          const byeMsg = `Atendimento finalizado com sucesso. Se precisar de algo mais, estamos à disposição! 👋`;
          await this.sendMessage(fromPhone, byeMsg);
          await this.ticketService.addArticle(activeTicket.id, `🔒 **Chat finalizado pelo cliente (#)**`, 'whatsapp', true, 1);
          return;
        }

        if (['1', '2', '3'].includes(trimmed)) {
          let targetGroupName = 'Suporte';
          if (trimmed === '2') targetGroupName = 'Comercial';
          if (trimmed === '3') targetGroupName = 'Financeiro';

          const targetGroup = await this.getOrCreateGroupByName(targetGroupName);
          activeTicket.group_id = targetGroup.id;
          activeTicket.state_id = 2; // Aberto / Em Fila
          await this.ticketService['ticketRepository'].save(activeTicket);

          const position = await this.getQueuePosition(activeTicket.id, targetGroup.id);

          const queueMsg =
            `Opção selecionada: *${targetGroupName}*\n\n` +
            `Enquanto você aguarda pelo atendimento, por favor explique com o máximo de detalhes o que você precisa. Isso irá agilizar muito o seu atendimento!\n\n` +
            `📌 *Você é o ${position}° na fila de atendimento.*`;

          await this.sendMessage(fromPhone, queueMsg);
          await this.ticketService.addArticle(
            activeTicket.id,
            `📋 **Fila selecionada pelo cliente:** ${targetGroupName} (${position}º na fila)`,
            'whatsapp',
            true,
            1
          );
          return;
        }

        // Se o cliente perguntar a posição na fila
        if (trimmed.toLowerCase().includes('fila') || trimmed.toLowerCase().includes('posição')) {
          const position = await this.getQueuePosition(activeTicket.id, activeTicket.group_id || 1);
          await this.sendMessage(fromPhone, `📌 Sua posição atual na fila é: *${position}°*`);
          return;
        }
      } else {
        // Chamado já em andamento (state_id in [2, 3, 4, 6])
        if (trimmed.toLowerCase().includes('fila') || trimmed.toLowerCase().includes('posição')) {
          const position = await this.getQueuePosition(activeTicket.id, activeTicket.group_id || 1);
          await this.sendMessage(fromPhone, `📌 Sua posição atual na fila é: *${position}°*`);
          return;
        }

        // Se estava pendente(4) ou dúvida(6), volta para Aberto(2)
        if (activeTicket.state_id === 4 || activeTicket.state_id === 6) {
          await this.ticketService.changeState(activeTicket.id, 2, user.id);
        }
      }
    } else {
      // 4. Criação de Novo Chamado & Disparo da URA Interativa
      const ticketData = {
        title: `Atendimento WhatsApp - ${profileName}`,
        customer_id: user.id,
        group_id: 1, // default Suporte
        priority_id: 2, // Média
        state_id: 1, // Triagem / URA
        source: 'whatsapp',
      };

      const created = await this.ticketService.createTicket(ticketData, text, [], attachments);

      // Verificação de Horário Comercial do cliente/organização
      let calendarType = 'standard_8_18';
      if (user.organization_id) {
        const userOrg = await this.userRepository.findOne({
          where: { id: user.id },
          relations: ['organization'],
        });
        if (userOrg?.organization?.calendar_type) {
          calendarType = userOrg.organization.calendar_type;
        }
      }

      const businessCheck = BusinessHoursUtil.isWithinBusinessHours(new Date(), calendarType);
      if (!businessCheck.isOpen) {
        const nextOpenStr = businessCheck.nextOpeningDate.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        const scheduleDescription = calendarType === 'extended_8_21'
          ? 'de Domingo a Domingo das 08h às 21h'
          : 'de Segunda a Sexta das 08h às 18h';

        const offHoursMsg = `Olá, ${profileName.split(' ')[0]}!\n\nNo momento estamos fora do nosso expediente comercial (${scheduleDescription}).\nSua mensagem foi registrada e o atendimento será iniciado no início do próximo expediente (${nextOpenStr}).`;

        try {
          await this.sendMessage(fromPhone, offHoursMsg);
          if (created && created.id) {
            await this.ticketService.addArticle(
              created.id,
              `⏰ **Aviso de Fora do Expediente:**\n${offHoursMsg}`,
              'whatsapp',
              true,
              1,
            );
          }
        } catch (err) {
          this.logger.error('Erro ao enviar mensagem de fora do expediente', err);
        }
      }

      // Envia o Menu da URA Interativa com Posição na Fila
      const uraMenu =
        `Olá, seja bem-vindo ao atendimento *DeskFlow*! 👋\n\n` +
        `Nosso horário de atendimento é de segunda a sexta das 08h às 18h.\n` +
        `(Para clientes com horário estendido, atendemos das 08h às 21h.)\n\n` +
        `Escolha uma fila de atendimento para ser atendido:\n` +
        `1 - Suporte\n` +
        `2 - Comercial\n` +
        `3 - Financeiro\n` +
        `# - Finalizar o chat.`;

      try {
        await this.sendMessage(fromPhone, uraMenu);
        if (created && created.id) {
          await this.ticketService.addArticle(
            created.id,
            `🤖 **Menu URA Enviado ao Cliente:**\n${uraMenu}`,
            'whatsapp',
            true,
            1,
          );
        }
      } catch (err) {
        this.logger.error('Erro ao enviar Menu URA WhatsApp', err);
      }
    }
  }

  /**
   * Gerencia a máquina de estados do CSAT em 2 Etapas
   */
  private async handleCsatResponse(ticket: Ticket, phone: string, responseText: string) {
    if (ticket.csat_stage === 'PENDING_RATING') {
      if (responseText === '9') {
        ticket.csat_stage = 'COMPLETED';
        ticket.satisfaction_answered_at = new Date();
        await this.ticketService['ticketRepository'].save(ticket);
        await this.sendMessage(phone, 'Agradecemos o seu contato. Caso precise de novo atendimento, estamos à disposição! 👋');
        await this.ticketService.addArticle(ticket.id, '⭐ **CSAT:** Cliente optou por não avaliar.', 'whatsapp', true, 1);
        return;
      }

      const scoreNum = parseInt(responseText, 10);
      if ([1, 2, 3, 4, 5].includes(scoreNum)) {
        ticket.satisfaction_score = scoreNum;
        ticket.csat_stage = 'PENDING_FEEDBACK';
        ticket.satisfaction_answered_at = new Date();
        await this.ticketService['ticketRepository'].save(ticket);

        const feedbackPrompt = 'Agradecemos a sua avaliação, por favor descreva o motivo que levou você a classificar esse atendimento ou digite 9 para encerrar sem um motivo.';
        await this.sendMessage(phone, feedbackPrompt);
        await this.ticketService.addArticle(
          ticket.id,
          `⭐ **CSAT Nota Recebida:** ${scoreNum}/5. Solicitado motivo/feedback ao cliente.`,
          'whatsapp',
          true,
          1
        );
      } else {
        await this.sendMessage(phone, 'Por favor, digite uma opção válida entre 1 e 5 para avaliar, ou 9 para não avaliar.');
      }
      return;
    }

    if (ticket.csat_stage === 'PENDING_FEEDBACK') {
      if (responseText !== '9') {
        ticket.satisfaction_comment = responseText;
      }
      ticket.csat_stage = 'COMPLETED';
      ticket.satisfaction_answered_at = new Date();
      await this.ticketService['ticketRepository'].save(ticket);

      const thanksMsg = 'Agradecemos o seu feedback! Sua opinião é fundamental para continuarmos evoluindo o nosso atendimento. Tenha um excelente dia! ✨';
      await this.sendMessage(phone, thanksMsg);
      await this.ticketService.addArticle(
        ticket.id,
        `⭐ **CSAT Concluído:** Nota ${ticket.satisfaction_score}/5${ticket.satisfaction_comment ? ` | Comentário: "${ticket.satisfaction_comment}"` : ' | Sem comentário adicional.'}`,
        'whatsapp',
        true,
        1
      );
    }
  }

  private async downloadMedia(media: any): Promise<any[]> {
    try {
      const token = await this.settingsService.getSetting('whatsapp_token');
      if (!token) return [];

      const mediaInfoUrl = `${GRAPH_API_BASE}/${media.id}`;
      const infoResponse = await firstValueFrom(this.httpService.get(mediaInfoUrl, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      
      const downloadUrl = infoResponse.data.url;
      const mimeType = infoResponse.data.mime_type || media.mime_type;
      
      const downloadResponse = await firstValueFrom(this.httpService.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }));

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

    const url = `${GRAPH_API_BASE}/${phoneId}/messages`;
    
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
      this.logger.error(`Failed to send WhatsApp message to ${toPhone}:`, this.extractError(error));
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
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('type', mimeType);
      formData.append('messaging_product', 'whatsapp');

      const uploadUrl = `${GRAPH_API_BASE}/${phoneId}/media`;
      const uploadResponse = await firstValueFrom(
        this.httpService.post(uploadUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        })
      );
      const mediaId = uploadResponse.data.id;

      let messageType = 'document';
      if (mimeType.startsWith('image/')) messageType = 'image';
      else if (mimeType.startsWith('video/')) messageType = 'video';
      else if (mimeType.startsWith('audio/')) messageType = 'audio';

      const messageUrl = `${GRAPH_API_BASE}/${phoneId}/messages`;
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
      
      if (text && messageType === 'audio') {
        await this.sendMessage(toPhone, text);
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp media to ${toPhone}:`, this.extractError(error));
    }
  }

  private extractError(error: unknown): any {
    if (isAxiosError(error)) {
      return error.response?.data || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
