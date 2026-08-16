import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { TicketService } from '../../tickets/services/ticket.service';

@Injectable()
export class SlaWatchdogService {
  private readonly logger = new Logger(SlaWatchdogService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly notificationsService: NotificationsService,
    private readonly ticketService: TicketService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleSlaWatchdog() {
    await this.checkSlaBreaches();
    await this.autoClosePendingTickets();
  }

  /**
   * Monitora e escalona chamados que ultrapassaram o tempo limite de SLA
   */
  private async checkSlaBreaches() {
    const now = new Date();

    const openTickets = await this.ticketRepository.find({
      where: {
        state_id: Not(5), // 5 = Resolvido
        isEscalated: false,
      },
    });

    for (const ticket of openTickets) {
      if (ticket.sla_paused_at) continue;

      let shouldEscalate = false;
      let reason = '';

      if (ticket.state_id === 1 && ticket.firstResponseEscalationAt && ticket.firstResponseEscalationAt <= now) {
        shouldEscalate = true;
        reason = 'tempo de primeira resposta excedido';
      }

      if (ticket.solutionEscalationAt && ticket.solutionEscalationAt <= now) {
        shouldEscalate = true;
        reason = 'tempo limite de resolução excedido';
      }

      if (shouldEscalate) {
        this.logger.warn(`[SLA WATCHDOG] Chamado #${ticket.id} escalonado: ${reason}`);
        ticket.isEscalated = true;
        await this.ticketRepository.save(ticket);

        await this.notificationsService.notifyAdminsAndAgents(
          'SLA Violado',
          `O chamado #${ticket.id} (${ticket.title}) violou o SLA (${reason}).`,
          'sla_breached',
          ticket.id,
        );
      }
    }
  }

  /**
   * Encerra automaticamente chamados em estado Pendente há mais de 3 dias sem resposta
   */
  private async autoClosePendingTickets() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingTickets = await this.ticketRepository.find({
      where: {
        state_id: 4, // 4 = Pendente
        updated_at: LessThan(threeDaysAgo),
      },
    });

    for (const ticket of pendingTickets) {
      this.logger.log(`[AUTO-CLOSE] Encerrando chamado inativo #${ticket.id} por inatividade`);
      
      await this.ticketService.changeState(ticket.id, 5, 1);

      await this.ticketService.addArticle(
        ticket.id,
        '**Chamado encerrado automaticamente pelo sistema.**\n\nMotivo: Ausência de resposta ou interação do cliente por mais de 3 dias.',
        'note',
        false,
        1
      );
    }
  }
}
