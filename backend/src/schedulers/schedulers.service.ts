import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Scheduler } from './entities/scheduler.entity';

@Injectable()
export class SchedulersService {
  constructor(
    @InjectRepository(Scheduler)
    private readonly schedulerRepository: Repository<Scheduler>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(): Promise<Scheduler[]> {
    return this.schedulerRepository.find();
  }

  async findById(id: number): Promise<Scheduler | null> {
    return this.schedulerRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Scheduler>): Promise<Scheduler> {
    return this.schedulerRepository.save(this.schedulerRepository.create(data));
  }

  async update(id: number, data: Partial<Scheduler>): Promise<Scheduler> {
    const scheduler = await this.schedulerRepository.findOne({ where: { id } });
    if (!scheduler) {
      throw new NotFoundException('Scheduler not found');
    }
    Object.assign(scheduler, data);
    return this.schedulerRepository.save(scheduler);
  }

  async remove(id: number): Promise<void> {
    await this.schedulerRepository.delete(id);
  }

  async run(id: number): Promise<Scheduler> {
    const scheduler = await this.schedulerRepository.findOne({ where: { id } });
    if (!scheduler) {
      throw new NotFoundException('Scheduler not found');
    }
    // Emit an event so domain modules can react to the scheduled action.
    this.eventEmitter.emit('scheduler.run', { scheduler });
    scheduler.last_run_at = new Date();
    return this.schedulerRepository.save(scheduler);
  }
}
