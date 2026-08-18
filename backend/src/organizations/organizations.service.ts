import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({ relations: { members: true } });
  }

  async findById(id: number): Promise<Organization | null> {
    return this.organizationRepository.findOne({ where: { id }, relations: { members: true } });
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const existing = await this.organizationRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Organization with this name already exists');
    }
    const organization = this.organizationRepository.create(data);
    return this.organizationRepository.save(organization);
  }

  async update(id: number, data: Partial<Organization>): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({ where: { id } });
    if (!organization) {
      throw new ConflictException('Organization not found');
    }
    Object.assign(organization, data);
    return this.organizationRepository.save(organization);
  }

  async remove(id: number): Promise<void> {
    await this.organizationRepository.softDelete(id);
  }
}
