import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Overview } from './entities/overview.entity';

@Injectable()
export class OverviewsService {
  constructor(
    @InjectRepository(Overview)
    private readonly overviewRepository: Repository<Overview>,
  ) {}

  async findAll(): Promise<Overview[]> {
    return this.overviewRepository.find({ order: { prio: 'ASC', name: 'ASC' } });
  }

  async findAvailable(roles: string[]): Promise<Overview[]> {
    const overviews = await this.overviewRepository.find({
      where: { active: true },
      order: { prio: 'ASC', name: 'ASC' },
    });
    if (!roles || roles.length === 0) {
      return overviews.filter((o) => !o.roles || o.roles.length === 0);
    }
    return overviews.filter((o) => !o.roles || o.roles.length === 0 || o.roles.some((r) => roles.includes(r)));
  }

  async findById(id: number): Promise<Overview | null> {
    return this.overviewRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Overview>): Promise<Overview> {
    const existing = await this.overviewRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Overview with this name already exists');
    }
    return this.overviewRepository.save(this.overviewRepository.create(data));
  }

  async update(id: number, data: Partial<Overview>): Promise<Overview> {
    const overview = await this.overviewRepository.findOne({ where: { id } });
    if (!overview) {
      throw new ConflictException('Overview not found');
    }
    Object.assign(overview, data);
    return this.overviewRepository.save(overview);
  }

  async remove(id: number): Promise<void> {
    await this.overviewRepository.softDelete(id);
  }
}
