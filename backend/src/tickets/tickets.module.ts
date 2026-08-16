import { Module, forwardRef } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Ticket } from './entities/ticket.entity';
import { Article } from './entities/article.entity';
import { TicketHistory } from './entities/ticket-history.entity';
import { TicketLink } from './entities/ticket-link.entity';
import { CustomField } from './entities/custom-field.entity';
import { TicketCustomFieldValue } from './entities/ticket-custom-field-value.entity';
import { TicketService } from './services/ticket.service';
import { CustomFieldsService } from './services/custom-fields.service';
import { TicketsController } from './tickets.controller';
import { CustomFieldsController } from './controllers/custom-fields.controller';
import { CsatController } from './controllers/csat.controller';
import { SLA_QUEUE_NAME, SlaQueueConsumer } from '../sla/sla-queue.consumer';
import { SlaPolicy } from '../sla/entities/sla-policy.entity';
import { SlaPoliciesService } from '../sla/services/sla-policies.service';
import { SlaWatchdogService } from '../sla/services/sla-watchdog.service';
import { SlaPoliciesController } from '../sla/controllers/sla-policies.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Article, TicketHistory, TicketLink, CustomField, TicketCustomFieldValue, SlaPolicy]),
    BullModule.registerQueue({
      name: SLA_QUEUE_NAME,
    }),
    NotificationsModule,
    forwardRef(() => EmailModule),
    forwardRef(() => WhatsappModule),
    SearchModule
  ],
  controllers: [TicketsController, CustomFieldsController, CsatController, SlaPoliciesController],
  providers: [TicketService, CustomFieldsService, SlaQueueConsumer, SlaPoliciesService, SlaWatchdogService],
  exports: [TicketService, TypeOrmModule],
})
export class TicketsModule {}
