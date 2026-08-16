import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Trigger } from './entities/trigger.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { TicketService } from '../tickets/services/ticket.service';
import { User } from '../iam/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TriggersService {
  private readonly logger = new Logger(TriggersService.name);

  constructor(
    @InjectRepository(Trigger)
    private readonly triggerRepository: Repository<Trigger>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly ticketService: TicketService,
    private readonly notificationsService: NotificationsService,
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
  async handleTicketUpdated(payload: { ticket: any; changedFields: any }) {
    await this.evaluateTriggers('ticket.updated', payload.ticket, payload.changedFields);
  }

  private async evaluateTriggers(eventType: string, ticket: any, changedFields?: any) {
    const activeTriggers = await this.triggerRepository.find({ 
      where: { is_active: true, event_type: eventType },
      order: { id: 'ASC' } 
    });

    for (const trigger of activeTriggers) {
      if (this.checkConditions(trigger.conditions, ticket, changedFields)) {
        this.logger.log(`[TRIGGER MATCH] Executando Gatilho #${trigger.id} (${trigger.name}) no Chamado #${ticket.id}`);
        await this.executeActions(trigger.actions, ticket);
      }
    }
  }

  private checkConditions(conditions: any[], ticket: any, changedFields?: any): boolean {
    if (!conditions || conditions.length === 0) return true;

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
      const actorUserId = 1; // Sistema

      try {
        switch (action) {
          case 'set_state':
            await this.ticketService.changeState(ticket.id, Number(value), actorUserId);
            break;

          case 'set_owner':
            await this.ticketService.assignTicket(ticket.id, Number(value), actorUserId);
            break;

          case 'set_group':
            await this.ticketService.changeGroup(ticket.id, Number(value), actorUserId);
            break;

          case 'set_priority':
            await this.ticketService.changePriority(ticket.id, Number(value), actorUserId);
            break;

          case 'round_robin_assign': {
            const targetGroupId = value ? Number(value) : ticket.group_id;
            const agents = await this.userRepository.find({
              where: { groups: { id: targetGroupId } },
              relations: { groups: true }
            });

            if (agents.length > 0) {
              let bestAgent = agents[0];
              let minOpenTickets = Infinity;

              for (const agent of agents) {
                const count = await this.ticketRepository.count({
                  where: { owner_id: agent.id, state_id: Not(5) }
                });
                if (count < minOpenTickets) {
                  minOpenTickets = count;
                  bestAgent = agent;
                }
              }

              await this.ticketService.assignTicket(ticket.id, bestAgent.id, actorUserId);
              this.logger.log(`[ROUND-ROBIN] Chamado #${ticket.id} balanceado para o agente ${bestAgent.firstname} ${bestAgent.lastname} (Fila atual: ${minOpenTickets})`);
            }
            break;
          }

          case 'send_notification':
            await this.notificationsService.notifyAdminsAndAgents(
              'Alerta de Automação (Trigger)',
              value || `Gatilho de automação executado no chamado #${ticket.id}`,
              'trigger_alert',
              ticket.id
            );
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
