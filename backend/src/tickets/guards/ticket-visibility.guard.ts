import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';

@Injectable()
export class TicketVisibilityGuard implements CanActivate {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumido que foi populado por um AuthGuard
    const ticketId = request.params.id;

    if (!user || !ticketId) {
      return false; 
    }

    // Buscando o ticket pelo ID
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (user.roles?.includes('admin') || user.roles?.includes('agent')) {
      return true;
    }

    // BR-MIGRAR-001: Cliente só pode ver seu próprio ticket
    // Obs: Expansão para "mesma organização" pode ser adicionada aqui posteriormente
    if (ticket.customer_id === user.id) {
      return true;
    }

    throw new ForbiddenException('You are not allowed to access this ticket');
  }
}
