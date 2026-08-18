import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private readonly itemRepository: Repository<ChecklistItem>,
  ) {}

  async getTicketChecklist(ticketId: number): Promise<Checklist | null> {
    return this.checklistRepository.findOne({
      where: { ticket_id: ticketId },
      relations: { items: true },
    });
  }

  async ensureChecklist(ticketId: number, name?: string): Promise<Checklist> {
    let checklist = await this.getTicketChecklist(ticketId);
    if (!checklist) {
      checklist = this.checklistRepository.create({ ticket_id: ticketId, name: name || 'Checklist' });
      checklist = await this.checklistRepository.save(checklist);
    }
    return this.getTicketChecklist(ticketId) as Promise<Checklist>;
  }

  async addItem(ticketId: number, text: string): Promise<ChecklistItem> {
    const checklist = await this.ensureChecklist(ticketId);
    const item = this.itemRepository.create({
      checklist_id: checklist.id,
      text,
      position: (checklist.items?.length || 0) + 1,
    });
    return this.itemRepository.save(item);
  }

  async toggleItem(itemId: number): Promise<ChecklistItem> {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }
    item.done = !item.done;
    return this.itemRepository.save(item);
  }

  async updateItem(itemId: number, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }
    Object.assign(item, data);
    return this.itemRepository.save(item);
  }

  async removeItem(itemId: number): Promise<void> {
    await this.itemRepository.delete(itemId);
  }

  async removeChecklist(checklistId: number): Promise<void> {
    const checklist = await this.checklistRepository.findOne({ where: { id: checklistId } });
    if (!checklist) {
      throw new ConflictException('Checklist not found');
    }
    await this.itemRepository.delete({ checklist_id: checklistId });
    await this.checklistRepository.delete(checklistId);
  }
}
