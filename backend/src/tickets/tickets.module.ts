import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Article } from './entities/article.entity';
import { TicketService } from './services/ticket.service';
import { TicketsController } from './tickets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Article])],
  controllers: [TicketsController],
  providers: [TicketService],
  exports: [TicketService, TypeOrmModule],
})
export class TicketsModule {}
