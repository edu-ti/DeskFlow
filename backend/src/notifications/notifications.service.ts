import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../iam/entities/user.entity';
import { NotificationsGateway } from './gateway/notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
    ticketId?: number,
  ): Promise<Notification | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    const notification = this.notificationsRepository.create({
      user,
      title,
      message,
      type,
      ticketId,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Emit via WebSocket
    this.notificationsGateway.sendNotificationToUser(userId, savedNotification);

    return savedNotification;
  }

  async notifyAdminsAndAgents(title: string, message: string, type: string, ticketId?: number) {
    // Find all users with admin or agent roles
    const users = await this.usersRepository.find({ relations: { roles: true } });
    const staff = users.filter((u) => u.roles && u.roles.some((r) => r.name === 'admin' || r.name === 'agent'));

    for (const user of staff) {
      await this.createNotification(user.id, title, message, type, ticketId);
    }
  }

  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await this.notificationsRepository.update({ id, user: { id: userId } }, { isRead: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationsRepository.update({ user: { id: userId }, isRead: false }, { isRead: true });
  }
}
