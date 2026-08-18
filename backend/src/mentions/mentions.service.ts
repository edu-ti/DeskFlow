import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mention } from './entities/mention.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MentionsService {
  constructor(
    @InjectRepository(Mention)
    private readonly mentionRepository: Repository<Mention>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listByTicket(ticketId: number): Promise<Mention[]> {
    return this.mentionRepository.find({
      where: { ticket_id: ticketId },
      relations: { user: true },
    });
  }

  async listByUser(userId: number): Promise<Mention[]> {
    return this.mentionRepository.find({
      where: { user_id: userId },
      relations: { ticket: true },
    });
  }

  async addMention(ticketId: number, userId: number, createdById?: number): Promise<Mention> {
    const existing = await this.mentionRepository.findOne({
      where: { ticket_id: ticketId, user_id: userId },
    });
    if (existing) {
      return existing;
    }
    const mention = await this.mentionRepository.save(
      this.mentionRepository.create({ ticket_id: ticketId, user_id: userId, created_by_id: createdById }),
    );
    await this.notificationsService.createNotification(
      userId,
      'Você foi mencionado',
      `Você foi mencionado no chamado #${ticketId}`,
      'mention',
      ticketId,
    );
    return mention;
  }

  async remove(ticketId: number, userId: number): Promise<void> {
    await this.mentionRepository.delete({ ticket_id: ticketId, user_id: userId });
  }
}
