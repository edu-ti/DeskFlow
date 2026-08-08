import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlaPolicy } from '../entities/sla-policy.entity';

@Injectable()
export class SlaPoliciesService {
  constructor(
    @InjectRepository(SlaPolicy)
    private slaPolicyRepo: Repository<SlaPolicy>,
  ) {}

  async findAll(): Promise<SlaPolicy[]> {
    return this.slaPolicyRepo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<SlaPolicy> {
    const policy = await this.slaPolicyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException('SLA Policy not found');
    }
    return policy;
  }

  async create(data: Partial<SlaPolicy>): Promise<SlaPolicy> {
    const policy = this.slaPolicyRepo.create(data);
    return this.slaPolicyRepo.save(policy);
  }

  async update(id: number, data: Partial<SlaPolicy>): Promise<SlaPolicy> {
    const policy = await this.findOne(id);
    Object.assign(policy, data);
    return this.slaPolicyRepo.save(policy);
  }

  async remove(id: number): Promise<void> {
    const policy = await this.findOne(id);
    await this.slaPolicyRepo.remove(policy);
  }

  async getMatchingPolicy(priority_id: number, group_id?: number): Promise<SlaPolicy | null> {
    const policies = await this.slaPolicyRepo.find({ where: { is_active: true } });
    
    // Sort policies by specificity
    // 1. group_id AND priority_id match
    // 2. group_id match (priority_id null)
    // 3. priority_id match (group_id null)
    // 4. Default (both null)
    let bestMatch: SlaPolicy | null = null;
    let highestScore = -1;

    for (const policy of policies) {
      let score = -1;
      
      const matchPriority = policy.priority_id === priority_id;
      const matchGroup = policy.group_id === group_id;
      
      if (matchPriority && matchGroup) score = 3;
      else if (matchGroup && policy.priority_id === null) score = 2;
      else if (matchPriority && policy.group_id === null) score = 1;
      else if (policy.priority_id === null && policy.group_id === null) score = 0;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = policy;
      }
    }

    return bestMatch;
  }
}
