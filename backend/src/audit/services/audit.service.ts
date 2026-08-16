import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, In } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../../iam/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Article } from '../../tickets/entities/article.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async logAction(
    userId: number | null,
    action: string,
    entityType?: string,
    entityId?: string | number,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    description?: string,
    req?: any,
  ): Promise<AuditLog> {
    try {
      const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
      const userAgent = req?.headers?.['user-agent'] || 'Sistema/Interno';

      const log = this.auditLogRepo.create({
        user_id: userId || undefined,
        action,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : undefined,
        ip_address: typeof ip === 'string' ? ip : ip[0],
        user_agent: userAgent.slice(0, 255),
        old_values: oldValues,
        new_values: newValues,
        description,
      });

      return await this.auditLogRepo.save(log);
    } catch (error) {
      this.logger.error('Falha ao gravar log de auditoria', error);
      return null as any;
    }
  }

  async getLogs(query: {
    action?: string;
    entity_type?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.created_at', 'DESC');

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    if (query.entity_type) {
      qb.andWhere('log.entity_type = :entity_type', { entity_type: query.entity_type });
    }

    if (query.user_id) {
      qb.andWhere('log.user_id = :user_id', { user_id: query.user_id });
    }

    if (query.start_date && query.end_date) {
      qb.andWhere('log.created_at BETWEEN :start AND :end', {
        start: new Date(query.start_date),
        end: new Date(query.end_date),
      });
    }

    if (query.search) {
      qb.andWhere(
        '(log.description ILIKE :search OR log.action ILIKE :search OR user.firstname ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportLogsCsv(query: any): Promise<string> {
    const { items } = await this.getLogs({ ...query, limit: 2000, page: 1 });
    
    const headers = ['ID', 'Data/Hora', 'Operador', 'E-mail', 'Ação', 'Entidade', 'ID Recurso', 'IP', 'Descrição'];
    const rows = items.map(l => [
      l.id,
      l.created_at.toISOString(),
      `"${(l.user?.firstname || '') + ' ' + (l.user?.lastname || '')}".trim() || 'Sistema'`,
      l.user?.email || 'N/A',
      l.action,
      l.entity_type || 'N/A',
      l.entity_id || 'N/A',
      l.ip_address || 'N/A',
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * LGPD: Exportar dossiê completo de dados do titular
   */
  async exportUserData(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { roles: true }
    });
    if (!user) throw new NotFoundException('Usuário titular não encontrado');

    const tickets = await this.ticketRepo.find({
      where: { customer_id: userId },
      relations: { articles: true },
      order: { created_at: 'DESC' }
    });

    const logs = await this.auditLogRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 100
    });

    return {
      generated_at: new Date().toISOString(),
      regulation: 'LGPD - Lei 13.709/2018 (Direito de Portabilidade dos Dados)',
      titular: {
        id: user.id,
        nome: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        login: user.login,
        email: user.email,
        telefone: user.phone,
        data_cadastro: user.created_at,
        papeis: user.roles?.map(r => r.name) || [],
      },
      chamados_vinculados: tickets.map(t => ({
        id: t.id,
        titulo: t.title,
        origem: t.source,
        data_criacao: t.created_at,
        status_id: t.state_id,
        mensagens_count: t.articles?.length || 0,
      })),
      historico_atividades_recentes: logs.map(l => ({
        data: l.created_at,
        acao: l.action,
        descricao: l.description,
      })),
    };
  }

  /**
   * LGPD: Anonimizar titular de dados (Direito ao Esquecimento)
   */
  async anonymizeUser(userId: number, actorId: number, req?: any) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário titular não encontrado');

    const oldSnapshot = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      login: user.login,
    };

    const anonId = `ANON_${user.id}_${Date.now().toString().slice(-4)}`;
    user.firstname = 'Titular';
    user.lastname = 'Anonimizado';
    user.login = anonId.toLowerCase();
    user.email = `${anonId.toLowerCase()}@anonimizado.deskflow.local`;
    user.phone = '+5500000000000';
    user.is_active = false;

    await this.userRepo.save(user);

    // Registra na trilha de auditoria
    await this.logAction(
      actorId,
      'USER_ANONYMIZE',
      'user',
      user.id,
      oldSnapshot,
      { status: 'ANONYMIZED', new_login: user.login },
      `Anonimização de dados pessoais do titular ID #${user.id} conforme LGPD.`,
      req
    );

    return {
      success: true,
      message: `Titular ID #${userId} foi anonimizado com sucesso conforme a LGPD.`,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      }
    };
  }
}
