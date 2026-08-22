import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  private statusNames: { [key: string]: string } = {
    '1': 'Novo / Triagem',
    '2': 'Aberto',
    '3': 'Em Atendimento',
    '4': 'Pendente',
    '5': 'Resolvido',
    '6': 'Fechado',
  };

  private applyFilters(query: any, period?: string, groupId?: string, organizationId?: string) {
    if (period && period !== 'all') {
      const days = parseInt(period.replace('d', ''));
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.andWhere('ticket.created_at >= :date', { date });
      }
    }
    
    if (groupId && groupId !== 'all') {
      query.andWhere('ticket.group_id = :groupId', { groupId: parseInt(groupId) });
    }

    if (organizationId && organizationId !== 'all') {
      query.innerJoin('ticket.customer', 'customer')
           .andWhere('customer.organization_id = :organizationId', { organizationId: parseInt(organizationId) });
    }
  }

  async getKpis(period: string, groupId?: string, organizationId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId, organizationId);

    const totalTickets = await qb.getCount();
    
    const resolvedTickets = await qb.clone().andWhere('ticket.state_id IN (:...states)', { states: [4, 5, 6] }).getCount();
    const openTickets = await qb.clone().andWhere('ticket.state_id IN (:...states)', { states: [1, 2, 3] }).getCount();
    const escalatedTickets = await qb.clone().andWhere('ticket.isEscalated = :isEscalated', { isEscalated: true }).getCount();
    
    // Taxa de SLA cumprido (%)
    const slaComplianceRate = totalTickets > 0 
      ? Math.max(0, Math.round(((totalTickets - escalatedTickets) / totalTickets) * 100))
      : 100;

    // Tempo médio de resolução (em horas)
    const resolvedData = await qb.clone().andWhere('ticket.state_id IN (:...states)', { states: [4, 5, 6] }).getMany();
    let avgResolutionTimeHours = 0;
    if (resolvedData.length > 0) {
      const totalTimeMs = resolvedData.reduce((acc, ticket) => {
        const diffMs = ticket.updated_at.getTime() - ticket.created_at.getTime();
        return acc + diffMs;
      }, 0);
      avgResolutionTimeHours = (totalTimeMs / resolvedData.length) / (1000 * 60 * 60);
    }
    
    // CSAT Média e Total de Avaliações
    const ticketsWithCsat = await qb.clone().andWhere('ticket.satisfaction_score IS NOT NULL').getMany();
    let csatScore = 0;
    if (ticketsWithCsat.length > 0) {
      const totalCsat = ticketsWithCsat.reduce((acc, ticket) => acc + (ticket.satisfaction_score || 0), 0);
      csatScore = totalCsat / ticketsWithCsat.length;
    }

    // Modalidades de Atendimento (Remoto vs Presencial)
    const remoteTickets = await qb.clone().andWhere('ticket.service_type != :st OR ticket.service_type IS NULL', { st: 'onsite' }).getCount();
    const onsiteTickets = await qb.clone().andWhere('ticket.service_type = :st', { st: 'onsite' }).getCount();

    return {
      totalTickets,
      resolvedTickets,
      openTickets,
      escalatedTickets,
      slaComplianceRate,
      avgResolutionTimeHours: avgResolutionTimeHours.toFixed(1),
      csatScore: csatScore.toFixed(1),
      totalCsatAnswers: ticketsWithCsat.length,
      remoteTickets,
      onsiteTickets,
    };
  }

  async getTicketsByStatus(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);

    const result = await qb
      .select('ticket.state_id', 'state_id')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('ticket.state_id')
      .getRawMany();

    return result.map(row => ({
      status: this.statusNames[String(row.state_id)] || `Status ${row.state_id}`,
      count: parseInt(row.count)
    }));
  }

  async getTicketsByGroup(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);

    const result = await qb
      .leftJoinAndSelect('ticket.group', 'group')
      .select('group.name', 'group_name')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('ticket.group_id')
      .addGroupBy('group.name')
      .getRawMany();

    return result.map(row => ({
      group: row.group_name || 'Sem Grupo',
      count: parseInt(row.count)
    }));
  }

  async getExecutiveRanking(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);
    qb.andWhere('ticket.owner_id IS NOT NULL');

    const raw = await qb
      .leftJoinAndSelect('ticket.owner', 'owner')
      .select('ticket.owner_id', 'owner_id')
      .addSelect('owner.firstname', 'firstname')
      .addSelect('owner.lastname', 'lastname')
      .addSelect('COUNT(ticket.id)', 'total_tickets')
      .addSelect('COUNT(CASE WHEN ticket.state_id IN (4, 5, 6) THEN 1 END)', 'resolved_tickets')
      .addSelect('COUNT(CASE WHEN ticket.isEscalated = true THEN 1 END)', 'escalated_tickets')
      .addSelect('AVG(ticket.satisfaction_score)', 'avg_csat')
      .groupBy('ticket.owner_id')
      .addGroupBy('owner.firstname')
      .addGroupBy('owner.lastname')
      .getRawMany();

    return raw.map(r => {
      const total = parseInt(r.total_tickets) || 0;
      const resolved = parseInt(r.resolved_tickets) || 0;
      const escalated = parseInt(r.escalated_tickets) || 0;
      const slaRate = total > 0 ? Math.max(0, Math.round(((total - escalated) / total) * 100)) : 100;
      const avgCsat = r.avg_csat ? parseFloat(r.avg_csat).toFixed(1) : '—';

      return {
        technician: `${r.firstname || ''} ${r.lastname || ''}`.trim() || `Técnico #${r.owner_id}`,
        totalTickets: total,
        resolvedTickets: resolved,
        escalatedTickets: escalated,
        slaComplianceRate: slaRate,
        avgCsat,
      };
    }).sort((a, b) => b.resolvedTickets - a.resolvedTickets);
  }

  async getTicketsTimeline(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);

    const openedRaw = await qb.clone()
      .select("TO_CHAR(ticket.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy("TO_CHAR(ticket.created_at, 'YYYY-MM-DD')")
      .orderBy("date", 'ASC')
      .getRawMany();

    const resolvedRaw = await qb.clone()
      .andWhere('ticket.state_id IN (:...states)', { states: [4, 5, 6] })
      .select("TO_CHAR(ticket.updated_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy("TO_CHAR(ticket.updated_at, 'YYYY-MM-DD')")
      .orderBy("date", 'ASC')
      .getRawMany();

    const dateMap = new Map<string, { opened: number, resolved: number }>();
    
    openedRaw.forEach(row => {
      if (row.date) {
        if (!dateMap.has(row.date)) dateMap.set(row.date, { opened: 0, resolved: 0 });
        dateMap.get(row.date)!.opened = parseInt(row.count);
      }
    });

    resolvedRaw.forEach(row => {
      if (row.date) {
        if (!dateMap.has(row.date)) dateMap.set(row.date, { opened: 0, resolved: 0 });
        dateMap.get(row.date)!.resolved = parseInt(row.count);
      }
    });

    return Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      opened: counts.opened,
      resolved: counts.resolved
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAgentProductivity(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);
    qb.andWhere('ticket.state_id IN (:...states)', { states: [4, 5, 6] });
    qb.andWhere('ticket.owner_id IS NOT NULL');

    const result = await qb
      .leftJoinAndSelect('ticket.owner', 'owner')
      .select('owner.firstname', 'firstname')
      .addSelect('owner.login', 'login')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('ticket.owner_id')
      .addGroupBy('owner.firstname')
      .addGroupBy('owner.login')
      .getRawMany();

    return result.map(row => ({
      agent: row.firstname || row.login,
      count: parseInt(row.count)
    })).sort((a, b) => b.count - a.count);
  }

  async exportCsv(period: string, groupId?: string): Promise<string> {
    const qb = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.group', 'group')
      .leftJoinAndSelect('ticket.customer', 'customer')
      .leftJoinAndSelect('ticket.owner', 'owner');
      
    this.applyFilters(qb, period, groupId);
    
    const tickets = await qb.orderBy('ticket.created_at', 'DESC').getMany();
    
    const header = [
      'ID', 
      'Titulo', 
      'Status', 
      'Modalidade',
      'Grupo', 
      'Cliente', 
      'Tecnico', 
      'SLA Violado', 
      'Nota CSAT (1-5)', 
      'Comentario CSAT',
      'Criado Em', 
      'Resolvido Em'
    ].join(',');

    const rows = tickets.map(t => {
      return [
        t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        this.statusNames[String(t.state_id)] || t.state_id,
        t.service_type === 'onsite' ? 'Presencial' : 'Remoto',
        `"${t.group?.name || ''}"`,
        `"${t.customer?.firstname || t.customer?.login || ''}"`,
        `"${t.owner?.firstname || t.owner?.login || ''}"`,
        t.isEscalated ? 'SIM' : 'NAO',
        t.satisfaction_score || '',
        `"${(t.satisfaction_comment || '').replace(/"/g, '""')}"`,
        t.created_at ? t.created_at.toISOString() : '',
        t.updated_at ? t.updated_at.toISOString() : ''
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
