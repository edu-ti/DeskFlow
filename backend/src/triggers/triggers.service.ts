import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trigger } from './entities/trigger.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { TicketService } from '../tickets/services/ticket.service';

@Injectable()
export class TriggersService {
  private readonly logger = new Logger(TriggersService.name);

  constructor(
    @InjectRepository(Trigger)
    private readonly triggerRepository: Repository<Trigger>,
    private readonly ticketService: TicketService,
  ) {}

  async create(createTriggerDto: Partial<Trigger>): Promise<Trigger> {
    const trigger = this.triggerRepository.create(createTriggerDto);
    return this.triggerRepository.save(trigger) as unknown as Promise<Trigger>;
  }

  async findAll(): Promise<Trigger[]> {
    return this.triggerRepository.find({ order: { created_at: 'ASC' } });
  }

  async findOne(id: number): Promise<Trigger | null> {
    return this.triggerRepository.findOne({ where: { id } });
  }

  async update(id: number, updateTriggerDto: any): Promise<Trigger | null> {
    await this.triggerRepository.update(id, updateTriggerDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.triggerRepository.delete(id);
  }

  @OnEvent('ticket.created')
  async handleTicketCreated(payload: { ticket: any }) {
    await this.evaluateTriggers('ticket.created', payload.ticket);
  }

  @OnEvent('ticket.updated')
  async handleTicketUpdated(payload: { ticket: any, changedFields: any }) {
    // Currently evaluate against the new state
    await this.evaluateTriggers('ticket.updated', payload.ticket, payload.changedFields);
  }

  private async evaluateTriggers(eventType: string, ticket: any, changedFields?: any) {
    const activeTriggers = await this.triggerRepository.find({ 
      where: { is_active: true, event_type: eventType },
      order: { id: 'ASC' } 
    });

    for (const trigger of activeTriggers) {
      if (this.checkConditions(trigger.conditions, ticket, changedFields)) {
        this.logger.log(`Executing Trigger #${trigger.id} - ${trigger.name} for Ticket #${ticket.id}`);
        await this.executeActions(trigger.actions, ticket);
      }
    }
  }

  private checkConditions(conditions: any[], ticket: any, changedFields?: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    // For now, assume ALL conditions must pass (AND logic)
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const ticketValue = ticket[field];

      let passes = false;
      switch (operator) {
        case 'equals':
          // eslint-disable-next-line eqeqeq
          passes = ticketValue == value;
          break;
        case 'not_equals':
          // eslint-disable-next-line eqeqeq
          passes = ticketValue != value;
          break;
        case 'contains':
          passes = ticketValue && String(ticketValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'changed':
          passes = changedFields && changedFields[field] !== undefined;
          break;
        case 'changed_to':
          // eslint-disable-next-line eqeqeq
          passes = changedFields && changedFields[field] && changedFields[field].new == value;
          break;
        default:
          passes = false;
      }

      if (!passes) {
        return false;
      }
    }

    return true;
  }

  private async executeActions(actions: any[], ticket: any) {
    if (!actions || actions.length === 0) return;

    for (const actionObj of actions) {
      const { action, value } = actionObj;
      const actorUserId = 1; // System user ID

      try {
        switch (action) {
          case 'set_state':
            await this.ticketService.changeState(ticket.id, Number(value), actorUserId);
            break;
          case 'set_owner':
            await this.ticketService.assignTicket(ticket.id, Number(value), actorUserId);
            break;
          case 'set_group':
            // we don't have changeGroup directly in ticketService yet. Let's assume updating directly.
            // For now let's skip or add it to TicketService if needed.
            break;
          case 'set_priority':
            // same here.
            break;
          default:
            this.logger.warn(`Unknown action: ${action}`);
        }
      } catch (error) {
        this.logger.error(`Error executing action ${action} for Ticket #${ticket.id}`, error);
      }
    }
  }
}
