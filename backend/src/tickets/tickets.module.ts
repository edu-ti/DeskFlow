import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Article } from './entities/article.entity';
import { TicketService } from './services/ticket.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Article])],
  providers: [TicketService],
  exports: [TicketService, TypeOrmModule],
})
export class TicketsModule {}
