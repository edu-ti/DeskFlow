import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Ticket } from '../tickets/entities/ticket.entity';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly INDEX_NAME = 'tickets';

  constructor(private readonly esService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      const indexExists = await this.esService.indices.exists({ index: this.INDEX_NAME });
      if (!indexExists) {
        await this.esService.indices.create({
          index: this.INDEX_NAME,
          mappings: {
            properties: {
              id: { type: 'integer' },
              title: { type: 'text' },
              state_id: { type: 'integer' },
              group_name: { type: 'keyword' },
              customer_name: { type: 'text' },
              owner_name: { type: 'text' },
              articles: { type: 'text' },
              created_at: { type: 'date' }
            }
          }
        });
        this.logger.log('Created Elasticsearch index: ' + this.INDEX_NAME);
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch index:', error);
    }
  }

  async indexTicket(ticket: Ticket, articlesText: string = '') {
    try {
      const customerName = ticket.customer ? ticket.customer.firstname + ' ' + ticket.customer.lastname : '';
      const ownerName = ticket.owner ? ticket.owner.firstname + ' ' + ticket.owner.lastname : '';
      
      await this.esService.index({
        index: this.INDEX_NAME,
        id: ticket.id.toString(),
        document: {
          id: ticket.id,
          title: ticket.title,
          state_id: ticket.state_id,
          group_name: ticket.group?.name || '',
          customer_name: customerName.trim(),
          owner_name: ownerName.trim(),
          articles: articlesText,
          created_at: ticket.created_at
        }
      });
    } catch (error) {
      this.logger.error('Failed to index ticket ' + ticket.id + ':', error);
    }
  }

  async searchTickets(query: string) {
    try {
      const result = await this.esService.search({
        index: this.INDEX_NAME,
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'customer_name^2', 'articles', 'owner_name']
          }
        }
      });
      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('Failed to search tickets with query "' + query + '":', error);
      return [];
    }
  }
}