import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Webhook } from './entities/webhook.entity';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async findAll(): Promise<Webhook[]> {
    return this.webhookRepository.find();
  }

  async create(data: Partial<Webhook>): Promise<Webhook> {
    return this.webhookRepository.save(this.webhookRepository.create(data));
  }

  async update(id: number, data: Partial<Webhook>): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    Object.assign(webhook, data);
    return this.webhookRepository.save(webhook);
  }

  async remove(id: number): Promise<void> {
    await this.webhookRepository.delete(id);
  }

  async dispatch(id: number, data: Record<string, any>): Promise<any> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (webhook.secret_token) {
      headers['X-Deskflow-Token'] = webhook.secret_token;
    }
    const response = await axios({
      method: webhook.http_method as any,
      url: webhook.endpoint,
      data: { ...webhook.payload, ...data },
      headers,
    });
    return response.data;
  }
}
