import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { PublicLink } from './entities/public-link.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Injectable()
export class PublicLinksService {
  constructor(
    @InjectRepository(PublicLink)
    private readonly publicLinkRepository: Repository<PublicLink>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async listByTicket(ticketId: number): Promise<PublicLink[]> {
    return this.publicLinkRepository.find({ where: { ticket_id: ticketId } });
  }

  async create(ticketId: number, expiresAt?: Date): Promise<PublicLink> {
    const link = this.publicLinkRepository.create({
      ticket_id: ticketId,
      token: randomUUID(),
      expires_at: expiresAt,
    });
    return this.publicLinkRepository.save(link);
  }

  async revoke(id: number): Promise<void> {
    await this.publicLinkRepository.delete(id);
  }

  async findTicketByToken(token: string): Promise<Ticket> {
    const link = await this.publicLinkRepository.findOne({
      where: { token },
      relations: { ticket: { articles: true } },
    });
    if (!link) {
      throw new NotFoundException('Public link not found');
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new NotFoundException('Public link expired');
    }
    return link.ticket;
  }
}
