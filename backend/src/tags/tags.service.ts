import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { TicketTag } from './entities/ticket-tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(TicketTag)
    private readonly ticketTagRepository: Repository<TicketTag>,
  ) {}

  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({ order: { name: 'ASC' } });
  }

  async create(data: Partial<Tag>): Promise<Tag> {
    const existing = await this.tagRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Tag already exists');
    }
    return this.tagRepository.save(this.tagRepository.create(data));
  }

  async update(id: number, data: Partial<Tag>): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new ConflictException('Tag not found');
    }
    Object.assign(tag, data);
    return this.tagRepository.save(tag);
  }

  async remove(id: number): Promise<void> {
    await this.ticketTagRepository.delete({ tag_id: id });
    await this.tagRepository.delete(id);
  }

  async getTicketTags(ticketId: number): Promise<Tag[]> {
    const rows = await this.ticketTagRepository.find({
      where: { ticket_id: ticketId },
      relations: { tag: true },
    });
    return rows.map((row) => row.tag);
  }

  async assignTag(ticketId: number, tagName: string): Promise<TicketTag> {
    let tag = await this.tagRepository.findOne({ where: { name: tagName } });
    if (!tag) {
      tag = await this.tagRepository.save(this.tagRepository.create({ name: tagName }));
    }
    const existing = await this.ticketTagRepository.findOne({
      where: { ticket_id: ticketId, tag_id: tag.id },
    });
    if (existing) {
      return existing;
    }
    return this.ticketTagRepository.save(
      this.ticketTagRepository.create({ ticket_id: ticketId, tag_id: tag.id }),
    );
  }

  async removeTicketTag(ticketId: number, tagId: number): Promise<void> {
    await this.ticketTagRepository.delete({ ticket_id: ticketId, tag_id: tagId });
  }
}
