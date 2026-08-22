import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldActivity } from './entities/field-activity.entity';
import { FieldServiceService } from './field-service.service';
import { FieldServiceController } from './field-service.controller';
import { TicketsModule } from '../tickets/tickets.module';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldActivity, Ticket]),
    forwardRef(() => TicketsModule),
  ],
  controllers: [FieldServiceController],
  providers: [FieldServiceService],
  exports: [FieldServiceService],
})
export class FieldServiceModule {}
