import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Article as KbArticle } from '../kb/entities/article.entity';
import { User } from '../iam/entities/user.entity';

export interface SearchResult {
  type: 'ticket' | 'article' | 'user';
  id: number;
  title: string;
  subtitle: string;
  route: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(KbArticle)
    private readonly kbArticleRepository: Repository<KbArticle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async globalSearch(query: string, maxResultsPerType: number = 5): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;
    const results: SearchResult[] = [];

    try {
      // 1. Search Tickets
      const tickets = await this.ticketRepository.createQueryBuilder('ticket')
        .where('ticket.title ILIKE :query', { query: searchTerm })
        .take(maxResultsPerType)
        .getMany();

      tickets.forEach(ticket => {
        results.push({
          type: 'ticket',
          id: ticket.id,
          title: `Chamado #${ticket.id}: ${ticket.title}`,
          subtitle: `Status: ${ticket.state_id} | Prioridade: ${ticket.priority_id}`,
          route: `/tickets/${ticket.id}`
        });
      });

      // 2. Search KB Articles
      const articles = await this.kbArticleRepository.createQueryBuilder('article')
        .where('article.title ILIKE :query', { query: searchTerm })
        .orWhere('article.content ILIKE :query', { query: searchTerm })
        .take(maxResultsPerType)
        .getMany();

      articles.forEach(article => {
        results.push({
          type: 'article',
          id: article.id,
          title: article.title,
          subtitle: 'Artigo da Base de Conhecimento',
          route: `/kb/${article.id}`
        });
      });

      // 3. Search Users
      const users = await this.userRepository.createQueryBuilder('user')
        .where('user.firstname ILIKE :query', { query: searchTerm })
        .orWhere('user.lastname ILIKE :query', { query: searchTerm })
        .orWhere('user.email ILIKE :query', { query: searchTerm })
        .take(maxResultsPerType)
        .getMany();

      users.forEach(user => {
        results.push({
          type: 'user',
          id: user.id,
          title: `${user.firstname} ${user.lastname}`,
          subtitle: user.email,
          route: `/admin/users` // Assuming we don't have a user profile page yet
        });
      });

    } catch (error) {
      this.logger.error('Error during global search', error);
    }

    return results;
  }
}
