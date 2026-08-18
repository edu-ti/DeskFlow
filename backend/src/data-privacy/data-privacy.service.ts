import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataPrivacyTask } from './entities/data-privacy-task.entity';
import { User } from '../iam/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Injectable()
export class DataPrivacyService {
  constructor(
    @InjectRepository(DataPrivacyTask)
    private readonly taskRepository: Repository<DataPrivacyTask>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async list(): Promise<DataPrivacyTask[]> {
    return this.taskRepository.find({ order: { created_at: 'DESC' } });
  }

  async create(data: Partial<DataPrivacyTask>): Promise<DataPrivacyTask> {
    return this.taskRepository.save(this.taskRepository.create(data));
  }

  async execute(id: number): Promise<DataPrivacyTask> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Data privacy task not found');
    }

    try {
      if (task.deletable_type === 'User') {
        const user = await this.userRepository.findOne({ where: { id: task.deletable_id } });
        if (user) {
          // Anonymize personal data before soft deletion (GDPR)
          user.firstname = 'Anonimizado';
          user.lastname = 'Anonimizado';
          user.email = `anonimizado+${user.id}@deskflow.local`;
          user.phone = '';
          await this.userRepository.save(user);
          await this.userRepository.softDelete(user.id);
        }
      } else if (task.deletable_type === 'Ticket') {
        await this.ticketRepository.softDelete(task.deletable_id);
      }
      task.state = 'done';
    } catch (err) {
      task.state = 'failed';
    }
    return this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
