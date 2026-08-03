import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketVisibilityGuard } from './ticket-visibility.guard';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('TicketVisibilityGuard (PT-001)', () => {
  let guard: TicketVisibilityGuard;
  let mockTicketRepository: Partial<Repository<Ticket>>;

  beforeEach(async () => {
    mockTicketRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketVisibilityGuard,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
      ],
    }).compile();

    guard = module.get<TicketVisibilityGuard>(TicketVisibilityGuard);
  });

  it('deve retornar 403 Forbidden quando o Cliente B tentar acessar o ticket do Cliente A', async () => {
    // Organizar: Cliente B está logado
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 2, name: 'Cliente B' },
          params: { id: 100 },
        }),
      }),
    } as unknown as ExecutionContext;

    // Ticket pertence ao Cliente A (id: 1)
    (mockTicketRepository.findOne as jest.Mock).mockResolvedValue({
      id: 100,
      customer_id: 1, 
    });

    // Agir e Verificar
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('You are not allowed to access this ticket');
  });

  it('deve permitir acesso quando o Cliente A tentar acessar seu próprio ticket', async () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 1, name: 'Cliente A' },
          params: { id: 100 },
        }),
      }),
    } as unknown as ExecutionContext;

    (mockTicketRepository.findOne as jest.Mock).mockResolvedValue({
      id: 100,
      customer_id: 1, 
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });
});
