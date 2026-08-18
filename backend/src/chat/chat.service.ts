import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

  async startSession(name?: string): Promise<ChatSession> {
    const session = this.sessionRepository.create({ token: randomUUID(), name, state: 'open' });
    return this.sessionRepository.save(session);
  }

  async getSessionByToken(token: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findOne({
      where: { token },
      relations: { messages: true },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  async sendMessage(token: string, content: string, fromCustomer: boolean): Promise<ChatMessage> {
    const session = await this.sessionRepository.findOne({ where: { token } });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return this.messageRepository.save(
      this.messageRepository.create({ session_id: session.id, content, from_customer: fromCustomer }),
    );
  }

  async closeSession(token: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findOne({ where: { token } });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    session.state = 'closed';
    return this.sessionRepository.save(session);
  }

  async listSessions(): Promise<ChatSession[]> {
    return this.sessionRepository.find({ relations: { messages: true }, order: { created_at: 'DESC' } });
  }
}
