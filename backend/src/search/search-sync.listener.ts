import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchService } from './search.service';

@Injectable()
export class SearchSyncListener {
  private readonly logger = new Logger(SearchSyncListener.name);

  constructor(private readonly searchService: SearchService) {}

  @OnEvent('ticket.created')
  async handleTicketCreatedEvent(payload: { ticket: any }) {
    this.logger.log(`Syncing new ticket #${payload.ticket.id} to Elasticsearch`);
    await this.searchService.indexTicket(payload.ticket);
  }

  @OnEvent('ticket.updated')
  async handleTicketUpdatedEvent(payload: { ticket: any; changedFields?: any }) {
    this.logger.log(`Syncing updated ticket #${payload.ticket.id} to Elasticsearch`);
    // If we had articles loaded, we could pass them. For now, we index ticket data.
    await this.searchService.indexTicket(payload.ticket);
  }
}
