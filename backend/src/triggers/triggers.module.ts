import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trigger } from './entities/trigger.entity';
import { TriggersService } from './triggers.service';
import { TriggersController } from './triggers.controller';
import { TicketsModule } from '../tickets/tickets.module';
import { User } from '../iam/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trigger, User, Ticket]),
    TicketsModule,
    NotificationsModule,
  ],
  controllers: [TriggersController],
  providers: [TriggersService],
  exports: [TriggersService],
})
export class TriggersModule {}
