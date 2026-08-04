import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Ticket } from '../entities/ticket.entity';
import { Article } from '../entities/article.entity';
import { TicketCreatedEvent } from '../events/ticket-created.event';
import { SLA_QUEUE_NAME, SlaJobData } from '../../sla/sla-queue.consumer';
import { BusinessHoursUtil } from '../../sla/business-hours.util';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectQueue(SLA_QUEUE_NAME)
    private readonly slaQueue: Queue,
  ) {}

  async createTicket(data: Partial<Ticket>, initialArticleBody: string): Promise<Ticket> {
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

    // Adiciona o job de validação de SLA
    const delay = firstResponseAt.getTime() - now.getTime();
    await this.slaQueue.add(
      'check-first-response',
      { ticketId: savedTicket.id, escalationType: 'firstResponse' } as SlaJobData,
      { delay }
    );

    // TODO: Disparar evento no barramento (ex: EventEmitter2)
    const event = new TicketCreatedEvent(savedTicket.id);

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

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        articles: true
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
    
    return ticket;
  }

  async addArticle(ticketId: number, body: string, type: string = 'note'): Promise<Article> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const article = this.articleRepository.create({
      ticket_id: ticketId,
      body,
      type,
    });

    return this.articleRepository.save(article);
  }

  async changeState(ticketId: number, newStateId: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.state_id = newStateId;
    
    // TODO: Recalcular SLA (BR-MIGRAR-002)

    return this.ticketRepository.save(ticket);
  }

  async softDeleteTicket(ticketId: number): Promise<void> {
    // Apenas marca o deleted_at, garantindo a rastreabilidade da Deleção Suave
    await this.ticketRepository.softDelete(ticketId);
  }
}
