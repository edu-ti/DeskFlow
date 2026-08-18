import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostmasterFilter } from './entities/postmaster-filter.entity';

@Injectable()
export class PostmasterFiltersService {
  constructor(
    @InjectRepository(PostmasterFilter)
    private readonly filterRepository: Repository<PostmasterFilter>,
  ) {}

  async findAll(): Promise<PostmasterFilter[]> {
    return this.filterRepository.find({ order: { prio: 'ASC', name: 'ASC' } });
  }

  async create(data: Partial<PostmasterFilter>): Promise<PostmasterFilter> {
    const existing = await this.filterRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Filter with this name already exists');
    }
    return this.filterRepository.save(this.filterRepository.create(data));
  }

  async update(id: number, data: Partial<PostmasterFilter>): Promise<PostmasterFilter> {
    const filter = await this.filterRepository.findOne({ where: { id } });
    if (!filter) {
      throw new ConflictException('Filter not found');
    }
    Object.assign(filter, data);
    return this.filterRepository.save(filter);
  }

  async remove(id: number): Promise<void> {
    await this.filterRepository.delete(id);
  }

  // Match a parsed inbound email against active filters, ordered by priority.
  async matchEmail(parsed: { from?: string; to?: string; subject?: string; body?: string }): Promise<PostmasterFilter[]> {
    const filters = await this.filterRepository.find({
      where: { active: true, channel: 'email' },
      order: { prio: 'ASC' },
    });
    const from = (parsed.from || '').toLowerCase();
    const to = (parsed.to || '').toLowerCase();
    const subject = (parsed.subject || '').toLowerCase();
    const body = (parsed.body || '').toLowerCase();

    return filters.filter((f) => {
      const m = f.match || {};
      if (m.from && !from.includes(String(m.from).toLowerCase())) return false;
      if (m.to && !to.includes(String(m.to).toLowerCase())) return false;
      if (m.subject && !subject.includes(String(m.subject).toLowerCase())) return false;
      if (m.body && !body.includes(String(m.body).toLowerCase())) return false;
      return true;
    });
  }
}
