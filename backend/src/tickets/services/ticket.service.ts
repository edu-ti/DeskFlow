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
  ) {}

  async createTicket(data: Partial<Ticket>, initialArticleBody: string, customFields?: { field_id: number, value: string }[]): Promise<Ticket> {
    const now = new Date();
    
    // MVP: SLA fixo de 4 horas para primeira resposta
    const firstResponseAt = BusinessHoursUtil.addBusinessHours(now, 4);
    
    data.firstResponseEscalationAt = firstResponseAt;

    const ticket = this.ticketRepository.create(data);
    const savedTicket = await this.ticketRepository.save(ticket);

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

    // Adiciona o job de validação de SLA
    const delay = firstResponseAt.getTime() - now.getTime();
    await this.slaQueue.add(
      'check-first-response',
      { ticketId: savedTicket.id, escalationType: 'firstResponse' } as SlaJobData,
      { delay }
    );

    // Disparar evento de notificacao para Admins/Agents
    await this.notificationsService.notifyAdminsAndAgents(
      'Novo Chamado',
      `O chamado #${savedTicket.id} foi criado.`,
      'ticket_created',
      savedTicket.id,
    );

    // TODO: Disparar evento no barramento (ex: EventEmitter2)
    const event = new TicketCreatedEvent(savedTicket.id);
    
    // Notify customer via email
    if (savedTicket.customer_id) {
       const ticketWithCustomer = await this.ticketRepository.findOne({ where: { id: savedTicket.id }, relations: { customer: true } });
       if (ticketWithCustomer && ticketWithCustomer.customer) {
         await this.smtpService.sendTicketCreatedEmail(ticketWithCustomer, ticketWithCustomer.customer);
       }
    }

    return savedTicket;
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({ 
      order: { 
        isEscalated: 'DESC',
        created_at: 'DESC' 
      } 
    });
  }

  async getDashboardStats() {
    const totalTickets = await this.ticketRepository.count();
    const openTickets = await this.ticketRepository.count({ where: { state_id: 1 } });
    const closedTickets = await this.ticketRepository.count({ where: { state_id: 4 } });
    const pendingTickets = totalTickets - openTickets - closedTickets;
    const escalatedTickets = await this.ticketRepository.count({ where: { isEscalated: true } });
    
    // Recent 7 days activity
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const activityRaw = await this.ticketRepository.createQueryBuilder('ticket')
      .select("DATE(ticket.created_at)", "date")
      .addSelect("SUM(CASE WHEN ticket.state_id != 4 THEN 1 ELSE 0 END)", "open")
      .addSelect("SUM(CASE WHEN ticket.state_id = 4 THEN 1 ELSE 0 END)", "resolved")
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
         await this.smtpService.sendTicketReplyEmail(ticketWithCustomer, savedArticle, ticketWithCustomer.customer);
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
      await this.ticketRepository.save(ticket);
      await this.addHistory(ticketId, actorUserId, 'state_id', oldState?.toString(), newStateId.toString());
      
      // TODO: Recalcular SLA (BR-MIGRAR-002)
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
}
