import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { FieldActivity, FieldActivityStatus } from './entities/field-activity.entity';
import { CreateFieldActivityDto, UpdateFieldActivityDto, CheckInDto, CheckOutDto } from './dto/field-activity.dto';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketService } from '../tickets/services/ticket.service';

@Injectable()
export class FieldServiceService {
  constructor(
    @InjectRepository(FieldActivity)
    private readonly activityRepo: Repository<FieldActivity>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly ticketService: TicketService,
  ) {}

  async create(dto: CreateFieldActivityDto, actorUserId: number = 1): Promise<FieldActivity> {
    const activity = this.activityRepo.create({
      ...dto,
      scheduled_at: new Date(dto.scheduled_at),
      status: (dto.status as FieldActivityStatus) || 'scheduled',
    });

    const saved = await this.activityRepo.save(activity);

    // Se vinculado a um chamado, define modalidade presencial e aplica SLA presencial de 8h úteis
    if (saved.ticket_id) {
      await this.ticketService.changeServiceType(saved.ticket_id, 'onsite', actorUserId);
      await this.ticketService.addArticle(
        saved.ticket_id,
        `📅 **Atendimento Presencial Agendado:**\n- Data/Hora: ${new Date(saved.scheduled_at).toLocaleString('pt-BR')}\n- Endereço: ${saved.address || 'Não informado'}\n- Detalhes: ${saved.title}`,
        'note',
        true,
        actorUserId
      );
    }

    return this.findOne(saved.id);
  }

  async findAll(filter?: {
    technician_id?: number;
    organization_id?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<FieldActivity[]> {
    const where: any = {};

    if (filter?.technician_id) where.technician_id = filter.technician_id;
    if (filter?.organization_id) where.organization_id = filter.organization_id;
    if (filter?.status) where.status = filter.status;

    if (filter?.from && filter?.to) {
      where.scheduled_at = Between(new Date(filter.from), new Date(filter.to));
    } else if (filter?.from) {
      where.scheduled_at = MoreThanOrEqual(new Date(filter.from));
    } else if (filter?.to) {
      where.scheduled_at = LessThanOrEqual(new Date(filter.to));
    }

    return this.activityRepo.find({
      where,
      relations: {
        ticket: {
          customer: true,
        },
        technician: true,
        organization: true,
      },
      order: {
        scheduled_at: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<FieldActivity> {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: {
        ticket: {
          customer: true,
          owner: true,
        },
        technician: true,
        organization: true,
      },
    });

    if (!activity) {
      throw new NotFoundException(`Atividade de campo #${id} não encontrada`);
    }

    return activity;
  }

  async update(id: number, dto: UpdateFieldActivityDto, actorUserId: number = 1): Promise<FieldActivity> {
    const activity = await this.findOne(id);

    if (dto.scheduled_at) {
      activity.scheduled_at = new Date(dto.scheduled_at);
    }
    if (dto.title) activity.title = dto.title;
    if (dto.description !== undefined) activity.description = dto.description;
    if (dto.technician_id !== undefined) activity.technician_id = dto.technician_id;
    if (dto.organization_id !== undefined) activity.organization_id = dto.organization_id;
    if (dto.status) activity.status = dto.status as FieldActivityStatus;
    if (dto.address !== undefined) activity.address = dto.address;
    if (dto.estimated_duration_mins !== undefined) activity.estimated_duration_mins = dto.estimated_duration_mins;
    if (dto.latitude !== undefined) activity.latitude = dto.latitude;
    if (dto.longitude !== undefined) activity.longitude = dto.longitude;
    if (dto.checkin_notes !== undefined) activity.checkin_notes = dto.checkin_notes;
    if (dto.checkout_notes !== undefined) activity.checkout_notes = dto.checkout_notes;

    await this.activityRepo.save(activity);
    return this.findOne(id);
  }

  async checkIn(id: number, dto: CheckInDto, actorUserId: number = 1): Promise<FieldActivity> {
    const activity = await this.findOne(id);

    activity.checkin_at = new Date();
    activity.status = 'in_progress';
    if (dto.notes) activity.checkin_notes = dto.notes;
    if (dto.latitude !== undefined) activity.latitude = dto.latitude;
    if (dto.longitude !== undefined) activity.longitude = dto.longitude;

    await this.activityRepo.save(activity);

    if (activity.ticket_id) {
      await this.ticketService.addArticle(
        activity.ticket_id,
        `📍 **Check-in Presencial Realizado:**\n- Horário: ${activity.checkin_at.toLocaleString('pt-BR')}${dto.notes ? `\n- Observações: ${dto.notes}` : ''}`,
        'note',
        true,
        actorUserId
      );
    }

    return this.findOne(id);
  }

  async checkOut(id: number, dto: CheckOutDto, actorUserId: number = 1): Promise<FieldActivity> {
    const activity = await this.findOne(id);

    activity.checkout_at = new Date();
    activity.status = 'completed';
    if (dto.notes) activity.checkout_notes = dto.notes;

    await this.activityRepo.save(activity);

    if (activity.ticket_id) {
      await this.ticketService.addArticle(
        activity.ticket_id,
        `🏁 **Check-out Presencial Concluído:**\n- Horário: ${activity.checkout_at.toLocaleString('pt-BR')}${dto.notes ? `\n- Relato Técnico: ${dto.notes}` : ''}`,
        'note',
        true,
        actorUserId
      );
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const activity = await this.findOne(id);
    await this.activityRepo.softDelete(activity.id);
    return { success: true };
  }
}
