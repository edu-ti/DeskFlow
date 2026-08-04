import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Ticket } from './entities/ticket.entity';
import { Article } from './entities/article.entity';
import { TicketService } from './services/ticket.service';
import { TicketsController } from './tickets.controller';
import { SLA_QUEUE_NAME, SlaQueueConsumer } from '../sla/sla-queue.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Article]),
    BullModule.registerQueue({
      name: SLA_QUEUE_NAME,
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketService, SlaQueueConsumer],
  exports: [TicketService, TypeOrmModule],
})
export class TicketsModule {}
