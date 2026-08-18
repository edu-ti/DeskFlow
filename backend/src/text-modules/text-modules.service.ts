import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextModule } from './entities/text-module.entity';

@Injectable()
export class TextModulesService {
  constructor(
    @InjectRepository(TextModule)
    private readonly textModuleRepository: Repository<TextModule>,
  ) {}

  async findAll(): Promise<TextModule[]> {
    return this.textModuleRepository.find({ order: { name: 'ASC' } });
  }

  async findActive(): Promise<TextModule[]> {
    return this.textModuleRepository.find({ where: { active: true }, order: { name: 'ASC' } });
  }

  async findById(id: number): Promise<TextModule | null> {
    return this.textModuleRepository.findOne({ where: { id } });
  }

  async create(data: Partial<TextModule>): Promise<TextModule> {
    const existing = await this.textModuleRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Text module with this name already exists');
    }
    return this.textModuleRepository.save(this.textModuleRepository.create(data));
  }

  async update(id: number, data: Partial<TextModule>): Promise<TextModule> {
    const textModule = await this.textModuleRepository.findOne({ where: { id } });
    if (!textModule) {
      throw new ConflictException('Text module not found');
    }
    Object.assign(textModule, data);
    return this.textModuleRepository.save(textModule);
  }

  async remove(id: number): Promise<void> {
    await this.textModuleRepository.softDelete(id);
  }
}
