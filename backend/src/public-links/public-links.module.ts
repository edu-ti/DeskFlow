import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicLink } from './entities/public-link.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { PublicLinksService } from './public-links.service';
import { PublicLinksController, PublicTicketController } from './public-links.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PublicLink, Ticket])],
  controllers: [PublicLinksController, PublicTicketController],
  providers: [PublicLinksService],
  exports: [PublicLinksService, TypeOrmModule],
})
export class PublicLinksModule {}
