import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeAccounting } from './entities/time-accounting.entity';

@Injectable()
export class TimeAccountingService {
  constructor(
    @InjectRepository(TimeAccounting)
    private readonly timeAccountingRepository: Repository<TimeAccounting>,
  ) {}

  async listByTicket(ticketId: number): Promise<TimeAccounting[]> {
    return this.timeAccountingRepository.find({
      where: { ticket_id: ticketId },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
  }

  async listByUser(userId: number): Promise<TimeAccounting[]> {
    return this.timeAccountingRepository.find({
      where: { user_id: userId },
      relations: { ticket: true },
      order: { created_at: 'DESC' },
    });
  }

  async create(data: Partial<TimeAccounting>): Promise<TimeAccounting> {
    return this.timeAccountingRepository.save(this.timeAccountingRepository.create(data));
  }

  async update(id: number, data: Partial<TimeAccounting>): Promise<TimeAccounting> {
    const entry = await this.timeAccountingRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Time accounting entry not found');
    }
    Object.assign(entry, data);
    return this.timeAccountingRepository.save(entry);
  }

  async remove(id: number): Promise<void> {
    await this.timeAccountingRepository.delete(id);
  }
}
