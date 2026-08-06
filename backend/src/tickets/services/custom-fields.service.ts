import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomField } from '../entities/custom-field.entity';

@Injectable()
export class CustomFieldsService {
  constructor(
    @InjectRepository(CustomField)
    private readonly customFieldRepository: Repository<CustomField>,
  ) {}

  async findAll(groupId?: number): Promise<CustomField[]> {
    const query = this.customFieldRepository.createQueryBuilder('cf');
    if (groupId) {
      query.where('cf.group_id = :groupId OR cf.group_id IS NULL', { groupId });
    }
    return query.getMany();
  }

  async findOne(id: number): Promise<CustomField> {
    const cf = await this.customFieldRepository.findOne({ where: { id } });
    if (!cf) {
      throw new NotFoundException(`CustomField with ID ${id} not found`);
    }
    return cf;
  }

  async create(data: Partial<CustomField>): Promise<CustomField> {
    const cf = this.customFieldRepository.create(data);
    return this.customFieldRepository.save(cf);
  }

  async update(id: number, data: Partial<CustomField>): Promise<CustomField> {
    const cf = await this.findOne(id);
    Object.assign(cf, data);
    return this.customFieldRepository.save(cf);
  }

  async remove(id: number): Promise<void> {
    const cf = await this.findOne(id);
    await this.customFieldRepository.remove(cf);
  }
}
