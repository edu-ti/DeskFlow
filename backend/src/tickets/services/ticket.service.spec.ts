import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Article } from '../entities/article.entity';
import { Repository } from 'typeorm';

describe('TicketService (PT-002 - Soft Delete)', () => {
  let service: TicketService;
  let mockTicketRepository: Partial<Repository<Ticket>>;
  let mockArticleRepository: Partial<Repository<Article>>;

  beforeEach(async () => {
    mockTicketRepository = {
      softDelete: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockArticleRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  it('deve delegar a exclusão para o método softDelete do repositório', async () => {
    // Organizar
    const ticketId = 200;
    (mockTicketRepository.softDelete as jest.Mock).mockResolvedValue({ raw: [], affected: 1 });

    // Agir
    await service.softDeleteTicket(ticketId);

    // Verificar (garante que a exclusão não é física/DELETE FROM, e sim lógica/softDelete)
    expect(mockTicketRepository.softDelete).toHaveBeenCalledWith(ticketId);
    expect(mockTicketRepository.softDelete).toHaveBeenCalledTimes(1);
  });
});
