import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Ticket } from './entities/ticket.entity';
import { Article } from './entities/article.entity';
import { TicketHistory } from './entities/ticket-history.entity';
import { CustomField } from './entities/custom-field.entity';
import { TicketCustomFieldValue } from './entities/ticket-custom-field-value.entity';
import { TicketService } from './services/ticket.service';
import { CustomFieldsService } from './services/custom-fields.service';
import { TicketsController } from './tickets.controller';
import { CustomFieldsController } from './controllers/custom-fields.controller';
import { SLA_QUEUE_NAME, SlaQueueConsumer } from '../sla/sla-queue.consumer';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Article, TicketHistory, CustomField, TicketCustomFieldValue]),
    BullModule.registerQueue({
      name: SLA_QUEUE_NAME,
    }),
    NotificationsModule
  ],
  controllers: [TicketsController, CustomFieldsController],
  providers: [TicketService, CustomFieldsService, SlaQueueConsumer],
  exports: [TicketService, TypeOrmModule],
})
export class TicketsModule {}
