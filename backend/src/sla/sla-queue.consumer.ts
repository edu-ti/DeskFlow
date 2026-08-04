import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Repository } from 'typeorm';

export const SLA_QUEUE_NAME = 'sla-queue';

export interface SlaJobData {
  ticketId: number;
  escalationType: 'firstResponse' | 'update' | 'solution';
}

@Processor(SLA_QUEUE_NAME)
@Injectable()
export class SlaQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(SlaQueueConsumer.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {
    super();
  }

  async process(job: Job<SlaJobData, any, string>): Promise<any> {
    this.logger.debug(`Processando Job de SLA para o Ticket ID: ${job.data.ticketId}, Tipo: ${job.data.escalationType}`);
    
    const ticket = await this.ticketRepository.findOne({ where: { id: job.data.ticketId } });
    if (!ticket) return;

    // Se o ticket já estiver fechado/resolvido, ignorar
    if (ticket.status === 'closed') return;

    // Verificar se o ticket ainda precisa de escalonamento para o tipo específico
    // Ex: Se o tipo for "firstResponse" e o ticket já teve resposta, a flag firstResponseEscalationAt pode ter sido limpa ou mudada
    let shouldEscalate = false;
    const now = new Date();

    if (job.data.escalationType === 'firstResponse' && ticket.firstResponseEscalationAt && ticket.firstResponseEscalationAt <= now) {
      shouldEscalate = true;
    }
    if (job.data.escalationType === 'update' && ticket.updateEscalationAt && ticket.updateEscalationAt <= now) {
      shouldEscalate = true;
    }
    if (job.data.escalationType === 'solution' && ticket.solutionEscalationAt && ticket.solutionEscalationAt <= now) {
      shouldEscalate = true;
    }

    if (shouldEscalate) {
      this.logger.warn(`SLA Violado para Ticket ID: ${job.data.ticketId}. Escalonando!`);
      ticket.isEscalated = true;
      await this.ticketRepository.save(ticket);
    }
  }
}
