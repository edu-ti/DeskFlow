import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Macro } from './entities/macro.entity';
import { TicketService } from '../tickets/services/ticket.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MacrosService {
  constructor(
    @InjectRepository(Macro)
    private readonly macroRepo: Repository<Macro>,
    private readonly ticketService: TicketService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAllActive() {
    return this.macroRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findAll() {
    return this.macroRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const macro = await this.macroRepo.findOne({ where: { id } });
    if (!macro) throw new NotFoundException('Macro not found');
    return macro;
  }

  async create(data: Partial<Macro>) {
    const macro = this.macroRepo.create(data);
    return this.macroRepo.save(macro);
  }

  async update(id: number, data: Partial<Macro>) {
    const macro = await this.findOne(id);
    Object.assign(macro, data);
    return this.macroRepo.save(macro);
  }

  async remove(id: number) {
    const macro = await this.findOne(id);
    return this.macroRepo.remove(macro);
  }

  async applyMacro(ticketId: number, macroId: number, userId: number) {
    const macro = await this.findOne(macroId);
    if (!macro.isActive) throw new Error('Macro is not active');

    let updateData: any = {};
    let articleData: any = null;

    // Process actions
    for (const action of macro.actions) {
      if (action.field === 'state_id') {
        updateData.state_id = action.value;
      } else if (action.field === 'group_id') {
        updateData.group_id = action.value;
      } else if (action.field === 'article') {
        articleData = action.value;
      }
    }

    // Apply updates via TicketService to maintain history and notifications
    if (updateData.state_id) {
      await this.ticketService.changeState(ticketId, updateData.state_id, userId);
    }

    // Add article if present
    if (articleData && articleData.body) {
      await this.ticketService.addArticle(
        ticketId, 
        articleData.body, 
        'note',
        articleData.is_internal || false, 
        userId
      );
    }

    // Notify ticket owner about macro application (optional, but good for tracking)
    const ticket = await this.ticketService.findOne(ticketId, { roles: ['admin'] });
    if (ticket.owner_id && ticket.owner_id !== userId) {
      await this.notificationsService.createNotification(
        ticket.owner_id,
        'Macro Applied',
        `Macro "${macro.name}" was applied to ticket #${ticket.id}`,
        'macro_applied',
        ticket.id
      );
    }

    return { success: true, message: `Macro "${macro.name}" applied successfully` };
  }
}
