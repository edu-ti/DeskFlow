import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Ticket } from '../entities/ticket.entity';
import { Article } from '../entities/article.entity';
import { TicketHistory } from '../entities/ticket-history.entity';
import { TicketCustomFieldValue } from '../entities/ticket-custom-field-value.entity';
import { TicketCreatedEvent } from '../events/ticket-created.event';
import { SLA_QUEUE_NAME, SlaJobData } from '../../sla/sla-queue.consumer';
import { BusinessHoursUtil } from '../../sla/business-hours.util';
import { NotificationsService } from '../../notifications/notifications.service';
import { SmtpService } from '../../email/services/smtp.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SlaPoliciesService } from '../../sla/services/sla-policies.service';
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
    @InjectRepository(TicketCustomFieldValue)
    private readonly customFieldValueRepository: Repository<TicketCustomFieldValue>,
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

  async createTicket(data: Partial<Ticket>, initialArticleBody: string, customFields?: { field_id: number, value: string }[]): Promise<Ticket> {
    const newTicket = this.ticketRepository.create(data);
    
    // Busca política de SLA aplicável
    const slaPolicy = await this.slaPoliciesService.getMatchingPolicy(
      newTicket.priority_id,
      newTicket.group_id
    );

    if (slaPolicy) {
      newTicket.firstResponseEscalationAt = BusinessHoursUtil.addMinutes(new Date(), slaPolicy.first_response_mins);
      newTicket.solutionEscalationAt = BusinessHoursUtil.addMinutes(new Date(), slaPolicy.resolution_mins);
    } else {
      // Fallback antigo caso não haja política
      let slaHours = 8;
      if (data.priority_id === 1) slaHours = 24;
      else if (data.priority_id === 2) slaHours = 8;
      else if (data.priority_id === 3) slaHours = 4;
      else if (data.priority_id === 4) slaHours = 2;
      
      newTicket.firstResponseEscalationAt = BusinessHoursUtil.addBusinessHours(new Date(), slaHours);
    }

    const savedTicket = await this.ticketRepository.save(newTicket);

    const article = this.articleRepository.create({
      ticket_id: savedTicket.id,
      body: initialArticleBody,
      type: 'note',
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

    // Agenda os Jobs do SLA de 1ª Resposta no BullMQ
    if (savedTicket.firstResponseEscalationAt) {
      const delayFull = savedTicket.firstResponseEscalationAt.getTime() - new Date().getTime();
      const delayWarning = delayFull - (30 * 60 * 1000); // 30 minutos antes
      
      if (delayWarning > 0) {
        await this.slaQueue.add('check-first-response-warning', {
          ticketId: savedTicket.id,
          escalationType: 'firstResponseWarning',
        } as SlaJobData, { delay: delayWarning, removeOnComplete: true });
      }
      
      if (delayFull > 0) {
        await this.slaQueue.add('check-first-response', {
          ticketId: savedTicket.id,
          escalationType: 'firstResponse',
        } as SlaJobData, { delay: delayFull, removeOnComplete: true });
      }
    }

    // Agenda os Jobs de Solução no BullMQ
    if (savedTicket.solutionEscalationAt) {
      const delayFullSolution = savedTicket.solutionEscalationAt.getTime() - new Date().getTime();
      
      if (delayFullSolution > 0) {
        await this.slaQueue.add('check-solution', {
          ticketId: savedTicket.id,
          escalationType: 'solution',
        } as SlaJobData, { delay: delayFullSolution, removeOnComplete: true });
      }
    }

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
    const whereClause = isCustomerOnly ? { customer_id: user.id } : {};

    return this.ticketRepository.find({
      where: whereClause,
      order: { 
        isEscalated: 'DESC',
        created_at: 'DESC' 
      } 
    });
  }

  async getDashboardStats() {
    const totalTickets = await this.ticketRepository.count();
    const openTickets = await this.ticketRepository.count({ where: { state_id: 2 } });
    const closedTickets = await this.ticketRepository.count({ where: { state_id: 5 } });
    const pendingTickets = await this.ticketRepository.count({ where: { state_id: 4 } });
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

  async findOne(id: number, user: any): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        owner: true,
        articles: true,
        history: {
          user: true
        },
        custom_field_values: {
          custom_field: true
        }
      },
      order: {
        articles: {
          created_at: 'ASC'
        },
        history: {
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

  async addArticle(ticketId: number, body: string, type: string = 'note', is_internal: boolean = false, actorUserId?: number): Promise<Article> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const article = this.articleRepository.create({
      ticket_id: ticketId,
      body,
      type,
      is_internal
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
        `Nova mensagem no chamado #${ticket.id}`,
        'ticket_updated',
        ticket.id,
      );
    }
    
    if (!is_internal && ticket.customer_id && ticket.customer_id !== actorUserId) {
       const ticketWithCustomer = await this.ticketRepository.findOne({ where: { id: ticketId }, relations: { customer: true } });
       if (ticketWithCustomer && ticketWithCustomer.customer) {
         if (ticketWithCustomer.source === 'whatsapp' && ticketWithCustomer.customer.phone) {
           await this.whatsappService.sendMessage(ticketWithCustomer.customer.phone, body);
         } else {
           await this.smtpService.sendTicketReplyEmail(ticketWithCustomer, savedArticle, ticketWithCustomer.customer);
         }
       }
    }

    return savedArticle;
  }

  async changeState(ticketId: number, newStateId: number, actorUserId: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldState = ticket.state_id;
    if (oldState !== newStateId) {
      ticket.state_id = newStateId;

      // Se mudou para Resolvido (5) e ainda não tem token de CSAT, gera um
      if (newStateId === 5 && !ticket.csat_token) {
        ticket.csat_token = require('crypto').randomUUID();
        
        if (ticket.source === 'email' || ticket.source === 'web') {
          // Enviar por E-mail
          if (ticket.customer_id) {
            const tFull = await this.ticketRepository.findOne({ where: { id: ticket.id }, relations: { customer: true } });
            if (tFull && tFull.customer) {
              await this.smtpService.sendCsatEmail(tFull, tFull.customer);
            }
          }
        } else if (ticket.source === 'whatsapp') {
          // TODO: Enviar pesquisa CSAT via WhatsApp (será implementado no módulo Omnichannel)
        }
      }

      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'state_id', oldState?.toString(), newStateId.toString());
      
      // TODO: Recalcular SLA (BR-MIGRAR-002)
      
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

  private async addHistory(ticketId: number, userId: number, field: string, oldValue: string, newValue: string) {
    const history = this.historyRepository.create({
      ticket_id: ticketId,
      user_id: userId,
      field,
      old_value: oldValue,
      new_value: newValue
    });
    await this.historyRepository.save(history);
  }

  async softDeleteTicket(ticketId: number): Promise<void> {
    // Apenas marca o deleted_at, garantindo a rastreabilidade da Deleção Suave
    await this.ticketRepository.softDelete(ticketId);
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
}
