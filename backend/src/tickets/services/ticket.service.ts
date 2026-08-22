import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Ticket } from '../entities/ticket.entity';
import { Article } from '../entities/article.entity';
import { TicketHistory } from '../entities/ticket-history.entity';
import { TicketLink } from '../entities/ticket-link.entity';
import { TicketCustomFieldValue } from '../entities/ticket-custom-field-value.entity';
import { TicketCreatedEvent } from '../events/ticket-created.event';
import { User } from '../../iam/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { SLA_QUEUE_NAME, SlaJobData } from '../../sla/sla-queue.consumer';
import { BusinessHoursUtil } from '../../sla/business-hours.util';
import { NotificationsService } from '../../notifications/notifications.service';
import { SmtpService } from '../../email/services/smtp.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SlaPoliciesService } from '../../sla/services/sla-policies.service';
import { SlaPolicy } from '../../sla/entities/sla-policy.entity';
import { WhatsappService } from '../../whatsapp/whatsapp.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(TicketHistory)
    private readonly historyRepository: Repository<TicketHistory>,
    @InjectRepository(TicketLink)
    private readonly linkRepository: Repository<TicketLink>,
    @InjectRepository(TicketCustomFieldValue)
    private readonly customFieldValueRepository: Repository<TicketCustomFieldValue>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue(SLA_QUEUE_NAME)
    private readonly slaQueue: Queue,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => SmtpService))
    private readonly smtpService: SmtpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly slaPoliciesService: SlaPoliciesService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Resolve o SLA e o calendário apropriado para um chamado com base no cliente/organização e na política ativa.
   */
  async resolveSlaForTicket(ticketData: Partial<Ticket>, baseDate: Date = new Date()): Promise<{
    firstResponseAt: Date;
    solutionAt: Date;
    onsiteAt: Date;
    calendarType: string;
    matchedPolicy: SlaPolicy | null;
  }> {
    let calendarType = 'standard_8_18';
    let matchedPolicy: SlaPolicy | null = null;

    // 1. Tenta carregar o cliente e sua organização se existir
    if (ticketData.customer_id) {
      const customer = await this.userRepository.findOne({
        where: { id: ticketData.customer_id },
        relations: { organization: { sla_policy: true } as any },
      });

      if (customer?.organization) {
        if (customer.organization.calendar_type) {
          calendarType = customer.organization.calendar_type;
        }
        if (customer.organization.sla_policy && customer.organization.sla_policy.is_active) {
          matchedPolicy = customer.organization.sla_policy;
        }
      }
    }

    // 2. Se não houver política fixa na organização, busca por prioridade e grupo
    if (!matchedPolicy) {
      matchedPolicy = await this.slaPoliciesService.getMatchingPolicy(
        ticketData.priority_id || 2,
        ticketData.group_id,
      );
    }

    if (matchedPolicy) {
      if (matchedPolicy.calendar_type && !ticketData.customer_id) {
        calendarType = matchedPolicy.calendar_type;
      }
      const firstMins = matchedPolicy.first_response_mins || 60; // 1h útil
      const solMins = matchedPolicy.resolution_mins || 240;      // 4h úteis
      const onsiteMins = matchedPolicy.onsite_resolution_mins || 480; // 8h úteis

      return {
        firstResponseAt: BusinessHoursUtil.addMinutes(baseDate, firstMins, 'America/Sao_Paulo', calendarType),
        solutionAt: BusinessHoursUtil.addMinutes(baseDate, solMins, 'America/Sao_Paulo', calendarType),
        onsiteAt: BusinessHoursUtil.addMinutes(baseDate, onsiteMins, 'America/Sao_Paulo', calendarType),
        calendarType,
        matchedPolicy,
      };
    }

    // Fallback padrão se não houver política cadastrada
    return {
      firstResponseAt: BusinessHoursUtil.addMinutes(baseDate, 60, 'America/Sao_Paulo', calendarType),
      solutionAt: BusinessHoursUtil.addMinutes(baseDate, 240, 'America/Sao_Paulo', calendarType),
      onsiteAt: BusinessHoursUtil.addMinutes(baseDate, 480, 'America/Sao_Paulo', calendarType),
      calendarType,
      matchedPolicy: null,
    };
  }

  async createTicket(data: Partial<Ticket>, initialArticleBody: string, customFields?: { field_id: number, value: string }[], attachments: any[] = []): Promise<Ticket> {
    const newTicket = this.ticketRepository.create(data);
    
    // Resolve prazos com base no calendário de atendimento contratado
    const slaTimes = await this.resolveSlaForTicket(newTicket, new Date());
    newTicket.firstResponseEscalationAt = slaTimes.firstResponseAt;
    newTicket.solutionEscalationAt = slaTimes.solutionAt;
    newTicket.onsiteResolutionEscalationAt = slaTimes.onsiteAt;

    const savedTicket = await this.ticketRepository.save(newTicket);

    const article = this.articleRepository.create({
      ticket_id: savedTicket.id,
      body: initialArticleBody,
      type: 'note',
      attachments
    });
    await this.articleRepository.save(article);

    if (customFields && customFields.length > 0) {
      const fieldValues = customFields.map(cf => this.customFieldValueRepository.create({
        ticket_id: savedTicket.id,
        custom_field_id: cf.field_id,
        value: cf.value
      }));
      await this.customFieldValueRepository.save(fieldValues);
    }

    // Agenda os Jobs do SLA no BullMQ usando os IDs para poder remover depois
    await this.scheduleSlaJobs(savedTicket);

    // Disparar evento de notificacao para Admins/Agents
    await this.notificationsService.notifyAdminsAndAgents(
      'Novo Chamado',
      `O chamado #${savedTicket.id} foi criado.`,
      'ticket_created',
      savedTicket.id,
    );

    // Disparar evento no barramento
    this.eventEmitter.emit('ticket.created', {
      ticket: savedTicket,
    });
    
    // Notify customer via email
    if (savedTicket.customer_id) {
       const ticketWithCustomer = await this.ticketRepository.findOne({ where: { id: savedTicket.id }, relations: { customer: true } });
       if (ticketWithCustomer && ticketWithCustomer.customer) {
         await this.smtpService.sendTicketCreatedEmail(ticketWithCustomer, ticketWithCustomer.customer);
       }
    }

    return savedTicket;
  }

  async findAll(user?: any): Promise<Ticket[]> {
    const isCustomerOnly = user?.roles?.length === 1 && user.roles.includes('customer');
    const isAgent = user?.roles?.includes('agent') && !user?.roles?.includes('admin');
    
    let whereClause: any = {};

    if (isCustomerOnly) {
      whereClause = { customer_id: user.id };
    } else if (isAgent) {
      const dbUser = await this.ticketRepository.manager.findOne(User, {
        where: { id: user.id },
        relations: { groups: true }
      });
      const groupIds = dbUser?.groups?.map((g: any) => g.id) || [];
      
      if (groupIds.length > 0) {
        whereClause = { group_id: In(groupIds) };
      } else {
        whereClause = { id: -1 }; // Impede acesso se o agente não tiver grupo
      }
    }

    return this.ticketRepository.find({
      where: whereClause,
      order: { 
        isEscalated: 'DESC',
        created_at: 'DESC' 
      },
      relations: {
        customer: true,
        owner: true,
        group: true,
      }
    });
  }

  async getDashboardStats() {
    const openTickets = await this.ticketRepository.count({ where: { state_id: 2 } });
    const pendingTickets = await this.ticketRepository.count({ where: { state_id: 3 } });
    const escalatedTickets = await this.ticketRepository.count({ where: { isEscalated: true } });
    
    // Recent 7 days activity
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const activityRaw = await this.ticketRepository.createQueryBuilder('ticket')
      .select("DATE(ticket.created_at)", "date")
      .addSelect("SUM(CASE WHEN ticket.state_id != 5 THEN 1 ELSE 0 END)", "open")
      .addSelect("SUM(CASE WHEN ticket.state_id = 5 THEN 1 ELSE 0 END)", "resolved")
      .where("ticket.created_at >= :date", { date: last7Days })
      .groupBy("DATE(ticket.created_at)")
      .orderBy("DATE(ticket.created_at)", "ASC")
      .getRawMany();

    const criticalAndOverdue = await this.ticketRepository.find({
      where: { isEscalated: true },
      order: { created_at: 'DESC' },
      take: 5
    });

    return {
      status: {
        open: openTickets,
        pending: pendingTickets > 0 ? pendingTickets : 0,
        dueToday: 0, // Mock
        overdue: escalatedTickets
      },
      activity: activityRaw.map(row => ({
        date: new Date(row.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        open: Number(row.open) || 0,
        resolved: Number(row.resolved) || 0
      })),
      criticalTickets: criticalAndOverdue,
      avgStats: {
        firstResponse: "35m",
        closeTime: "4h 20m",
        timeEntry: "1h 10m"
      }
    };
  }

  async findOne(id: number, user?: any): Promise<Ticket> {
    const isCustomerOnly = user?.roles?.length === 1 && user.roles.includes('customer');

    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: {
        customer: {
          organization: true,
        } as any,
        owner: true,
        group: true,
        articles: true,
        custom_field_values: {
          custom_field: true,
        },
        sub_tickets: true,
        parent: true,
        history: {
          user: true
        }
      },
      order: {
        articles: {
          created_at: 'ASC'
        }
      }
    });
    
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const isAdminOrAgent = user?.roles?.includes('admin') || user?.roles?.includes('agent');
    if (!isAdminOrAgent && ticket.articles) {
      ticket.articles = ticket.articles.filter(article => !article.is_internal);
    }
    
    return ticket;
  }

  async addArticle(ticketId: number, body: string, type: string = 'note', is_internal: boolean = false, actorUserId?: number, attachments: any[] = []): Promise<Article> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const article = this.articleRepository.create({
      ticket_id: ticketId,
      body,
      type,
      is_internal,
      attachments
    });

    const savedArticle = await this.articleRepository.save(article);

    // Notificar cliente e agente designado, exceto quem enviou a nota
    if (ticket.customer_id && ticket.customer_id !== actorUserId) {
      if (!is_internal) { // Cliente nao pode ser notificado de nota interna
        await this.notificationsService.createNotification(
          ticket.customer_id,
          'Nova Interação',
          `Nova mensagem no chamado #${ticket.id}`,
          'ticket_updated',
          ticket.id,
        );
      }
    }

    if (ticket.owner_id && ticket.owner_id !== actorUserId) {
      await this.notificationsService.createNotification(
        ticket.owner_id,
        'Nova Interação',
        `Nova resposta no chamado #${ticket.id} (${ticket.title})`,
        'ticket_updated',
        ticket.id,
      );
    }

    // Se o artigo for publico (resposta do agente), envia no WhatsApp se a origem for whatsapp
    if (ticket.source === 'whatsapp' && !is_internal && type !== 'whatsapp') {
      const customer = await this.userRepository.findOne({ where: { id: ticket.customer_id } });
      if (customer && customer.phone) {
        // Envia mensagem de texto no WhatsApp do cliente
        if (body && body.trim().length > 0) {
          await this.whatsappService.sendMessage(customer.phone, body);
        }

        // Se houver anexos gerados pelo atendente, envia as mídias para o WhatsApp do cliente
        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            if (att.localPath && att.mimetype) {
              await this.whatsappService.sendMediaMessage(
                customer.phone,
                att.localPath,
                att.mimetype,
                att.filename
              );
            }
          }
        }
      }
    }

    // Disparar evento no barramento (BR-CORE-004)
    this.eventEmitter.emit('article.created', {
      article: savedArticle,
      ticket,
      actorUserId
    });

    return savedArticle;
  }

  async changeState(ticketId: number, newStateId: number, actorUserId: number = 1): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldState = ticket.state_id;
    if (oldState !== newStateId) {
      ticket.state_id = newStateId;

      if (newStateId === 5 || newStateId === 6) {
        // Removendo jobs de SLA ao fechar/resolver
        await this.removeSlaJobs(ticket.id);

        // Dispara Pesquisa de Satisfação CSAT para chamados originados do WhatsApp
        if (ticket.source === 'whatsapp' && ticket.customer_id) {
          const customer = await this.userRepository.findOne({ where: { id: ticket.customer_id } });
          if (customer && customer.phone) {
            await this.whatsappService.sendCsatSurvey(ticket.id, customer.phone);
          }
        }
      }

      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'state_id', oldState?.toString(), newStateId.toString());
      
      this.eventEmitter.emit('ticket.updated', {
        ticket,
        changedFields: { state_id: { old: oldState, new: newStateId } }
      });
    }

    return ticket;
  }

  async assignTicket(ticketId: number, ownerId: number, actorUserId: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldOwner = ticket.owner_id;
    if (oldOwner !== ownerId) {
      ticket.owner_id = ownerId;
      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'owner_id', oldOwner?.toString(), ownerId.toString());

      if (ownerId && ownerId !== actorUserId) {
        await this.notificationsService.createNotification(
          ownerId,
          'Chamado Atribuído',
          `O chamado #${ticket.id} foi atribuído a você.`,
          'ticket_assigned',
          ticket.id,
        );
      }
      
      this.eventEmitter.emit('ticket.updated', {
        ticket,
        changedFields: { owner_id: { old: oldOwner, new: ownerId } }
      });
    }

    return ticket;
  }

  async transferTicket(ticketId: number, groupId: number, ownerId: number | null, note: string, actorUserId: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldGroup = ticket.group_id;
    const oldOwner = ticket.owner_id;

    if (oldGroup !== groupId || oldOwner !== ownerId) {
      ticket.group_id = groupId;
      ticket.owner_id = ownerId as any;

      // Recalcula SLA se o grupo mudar
      if (oldGroup !== groupId) {
        const slaTimes = await this.resolveSlaForTicket(ticket, ticket.created_at || new Date());
        if (!ticket.firstResponseEscalationAt || ticket.state_id === 1) {
          ticket.firstResponseEscalationAt = slaTimes.firstResponseAt;
        }
        ticket.solutionEscalationAt = slaTimes.solutionAt;
        ticket.onsiteResolutionEscalationAt = slaTimes.onsiteAt;
        await this.removeSlaJobs(ticket.id);
        await this.scheduleSlaJobs(ticket);
      }

      await this.ticketRepository.save(ticket);
      
      // Registrar no histórico a mudança de grupo
      if (oldGroup !== groupId) {
        await this.addHistory(ticketId, actorUserId, 'group_id', oldGroup?.toString(), groupId.toString());
      }
      // Registrar no histórico a mudança de dono se houver
      if (oldOwner !== ownerId) {
        await this.addHistory(ticketId, actorUserId, 'owner_id', oldOwner?.toString() || '', ownerId?.toString() || '');
      }

      // Adicionar a nota interna com a justificativa
      await this.addArticle(
        ticketId,
        `**Chamado transferido de Setor.**\n\nMotivo da transferência: ${note}`,
        'note',
        true, // is_internal
        actorUserId
      );

      this.eventEmitter.emit('ticket.updated', {
        ticket,
        changedFields: {
          group_id: { old: oldGroup, new: groupId },
          owner_id: { old: oldOwner, new: ownerId }
        }
      });
    }

    return ticket;
  }

  async changeTitle(ticketId: number, title: string, actorUserId: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldTitle = ticket.title;
    if (oldTitle !== title) {
      ticket.title = title;
      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'title', oldTitle, title);

      this.eventEmitter.emit('ticket.updated', {
        ticket,
        changedFields: { title: { old: oldTitle, new: title } }
      });
    }

    return ticket;
  }

  private async addHistory(ticketId: number, userId: number, field: string, oldValue: string | null, newValue: string | null) {
    const history = this.historyRepository.create({
      ticket_id: ticketId,
      user_id: userId,
      field,
      old_value: oldValue,
      new_value: newValue,
    });
    await this.historyRepository.save(history);
  }

  async changePriority(ticketId: number, priorityId: number, actorUserId: number = 1): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    
    const oldPriority = ticket.priority_id;
    if (oldPriority !== priorityId) {
      ticket.priority_id = priorityId;

      // Recalcular SLA baseado na nova prioridade e no calendário da empresa
      const slaTimes = await this.resolveSlaForTicket(ticket, ticket.created_at || new Date());
      if (!ticket.firstResponseEscalationAt || ticket.state_id === 1) {
        ticket.firstResponseEscalationAt = slaTimes.firstResponseAt;
      }
      ticket.solutionEscalationAt = slaTimes.solutionAt;
      ticket.onsiteResolutionEscalationAt = slaTimes.onsiteAt;
      
      await this.removeSlaJobs(ticket.id);
      await this.scheduleSlaJobs(ticket);

      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'priority_id', oldPriority?.toString(), priorityId.toString());
      this.eventEmitter.emit('ticket.updated', {
        ticket,
        changedFields: { priority_id: { old: oldPriority, new: priorityId } }
      });
    }
    return ticket;
  }

  async changeServiceType(ticketId: number, serviceType: string, actorUserId: number = 1): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const oldType = ticket.service_type;
    if (oldType !== serviceType) {
      ticket.service_type = serviceType;

      const slaTimes = await this.resolveSlaForTicket(ticket, ticket.created_at || new Date());
      ticket.onsiteResolutionEscalationAt = slaTimes.onsiteAt;

      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'service_type', oldType, serviceType);

      await this.addArticle(
        ticketId,
        `Tipo de atendimento alterado para: **${serviceType === 'onsite' ? 'Atendimento Presencial' : 'Atendimento Remoto'}**`,
        'note',
        true,
        actorUserId
      );

      this.eventEmitter.emit('ticket.updated', {
        ticket,
        changedFields: { service_type: { old: oldType, new: serviceType } }
      });
    }

    return ticket;
  }

  async changeGroup(ticketId: number, groupId: number, actorUserId: number = 1): Promise<Ticket> {
    return this.transferTicket(ticketId, groupId, null, 'Alteração automática de grupo', actorUserId);
  }

  async softDeleteTicket(ticketId: number): Promise<void> {
    await this.ticketRepository.softDelete(ticketId);
  }

  async mergeTickets(sourceTicketId: number, targetTicketId: number, actorUserId: number): Promise<void> {
    const sourceTicket = await this.ticketRepository.findOne({
      where: { id: sourceTicketId },
      relations: { articles: true }
    });
    const targetTicket = await this.ticketRepository.findOne({ where: { id: targetTicketId } });

    if (!sourceTicket || !targetTicket) {
      throw new NotFoundException('One or both tickets not found');
    }

    // 1. Move all articles from source to target
    if (sourceTicket.articles && sourceTicket.articles.length > 0) {
      for (const article of sourceTicket.articles) {
        article.ticket_id = targetTicketId;
        await this.articleRepository.save(article);
      }
    }

    // 2. Add merge note to target
    await this.addArticle(
      targetTicketId,
      `Chamado #${sourceTicketId} mesclado neste chamado.`,
      'note',
      true, // internal
      actorUserId
    );

    // 3. Close source ticket with state_id = 5 (Fechado/Resolvido)
    await this.changeState(sourceTicketId, 5, actorUserId);
    await this.addArticle(
      sourceTicketId,
      `Chamado mesclado no chamado #${targetTicketId} e fechado automaticamente.`,
      'note',
      true, // internal
      actorUserId
    );
  }

  async linkTickets(sourceTicketId: number, targetTicketId: number, actorUserId: number): Promise<TicketLink> {
    const sourceTicket = await this.ticketRepository.findOne({ where: { id: sourceTicketId } });
    const targetTicket = await this.ticketRepository.findOne({ where: { id: targetTicketId } });

    if (!sourceTicket || !targetTicket) {
      throw new NotFoundException('One or both tickets not found');
    }

    const newLink = this.linkRepository.create({
      source_ticket_id: sourceTicketId,
      target_ticket_id: targetTicketId,
      created_by_id: actorUserId,
    });
    
    await this.linkRepository.save(newLink);

    // Add Internal Notes
    await this.addArticle(
      sourceTicketId,
      `Este chamado foi vinculado ao Ticket #${targetTicketId}.`,
      'note',
      true, // internal
      actorUserId
    );
    await this.addArticle(
      targetTicketId,
      `O Ticket #${sourceTicketId} foi vinculado a este chamado.`,
      'note',
      true, // internal
      actorUserId
    );

    return newLink;
  }

  async getLinks(ticketId: number): Promise<TicketLink[]> {
    return this.linkRepository.find({
      where: [
        { source_ticket_id: ticketId },
        { target_ticket_id: ticketId }
      ],
      relations: {
        source_ticket: true,
        target_ticket: true
      }
    });
  }

  async createSubticket(parentTicketId: number, actorUserId: number, title: string): Promise<Ticket> {
    const parentTicket = await this.ticketRepository.findOne({ where: { id: parentTicketId } });
    
    if (!parentTicket) {
      throw new NotFoundException('Parent ticket not found');
    }

    // Criamos o novo chamado com os mesmos dados básicos, mas amarrado no parent_id
    const subticket = this.ticketRepository.create({
      title: title || `[Subprocesso] ${parentTicket.title}`,
      source: parentTicket.source,
      group_id: parentTicket.group_id,
      state_id: 2, // Aberto
      priority_id: parentTicket.priority_id,
      customer_id: parentTicket.customer_id,
      parent_id: parentTicket.id,
    });

    const savedSubticket = await this.ticketRepository.save(subticket);

    // Nota no filho
    await this.addArticle(
      savedSubticket.id,
      `Subprocesso criado a partir do Ticket #${parentTicket.id}.`,
      'note',
      true,
      actorUserId
    );

    // Nota no pai
    await this.addArticle(
      parentTicket.id,
      `Subprocesso Ticket #${savedSubticket.id} foi criado.`,
      'note',
      true,
      actorUserId
    );

    return savedSubticket;
  }

  async getTicketByCsatToken(token: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { csat_token: token },
      relations: { customer: true, owner: true }
    });
    if (!ticket) {
      throw new NotFoundException('Pesquisa de satisfação não encontrada ou token inválido.');
    }
    return ticket;
  }

  async submitCsat(token: string, score: number, comment?: string): Promise<Ticket> {
    const ticket = await this.getTicketByCsatToken(token);
    
    // Se já foi respondido, não deixa responder de novo
    if (ticket.satisfaction_score) {
      throw new Error('Esta pesquisa já foi respondida.');
    }

    ticket.satisfaction_score = score;
    if (comment) {
      ticket.satisfaction_comment = comment;
    }
    
    await this.ticketRepository.save(ticket);
    return ticket;
  }

  // --- Helper Methods para SLA (BR-MIGRAR-002) ---
  private async removeSlaJobs(ticketId: number) {
    try {
      const frwJob = await this.slaQueue.getJob(`frw-${ticketId}`);
      if (frwJob) await frwJob.remove();

      const frJob = await this.slaQueue.getJob(`fr-${ticketId}`);
      if (frJob) await frJob.remove();

      const solJob = await this.slaQueue.getJob(`sol-${ticketId}`);
      if (solJob) await solJob.remove();
    } catch (e) {
      // Ignore
    }
  }

  private async scheduleSlaJobs(ticket: Ticket) {
    await this.removeSlaJobs(ticket.id);
    const now = new Date().getTime();

    if (ticket.firstResponseEscalationAt) {
      const delayFull = ticket.firstResponseEscalationAt.getTime() - now;
      if (delayFull > 0) {
        const delayWarning = delayFull - (30 * 60 * 1000); // 30 minutos antes
        if (delayWarning > 0) {
          await this.slaQueue.add('check-first-response-warning', 
            { ticketId: ticket.id, escalationType: 'firstResponseWarning' } as SlaJobData, 
            { delay: delayWarning, jobId: `frw-${ticket.id}`, removeOnComplete: true }
          );
        }
        await this.slaQueue.add('check-first-response', 
          { ticketId: ticket.id, escalationType: 'firstResponse' } as SlaJobData, 
          { delay: delayFull, jobId: `fr-${ticket.id}`, removeOnComplete: true }
        );
      }
    }

    if (ticket.solutionEscalationAt) {
      const delayFull = ticket.solutionEscalationAt.getTime() - now;
      if (delayFull > 0) {
        await this.slaQueue.add('check-solution', 
          { ticketId: ticket.id, escalationType: 'solution' } as SlaJobData, 
          { delay: delayFull, jobId: `sol-${ticket.id}`, removeOnComplete: true }
        );
      }
    }
  }
}
