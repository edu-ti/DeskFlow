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
    '1': 'Triagem',
    '2': 'Aberto',
    '3': 'Em Atendimento',
    '4': 'Pendente',
    '5': 'Resolvido',
    '6': 'Dúvida',
  };

  private applyFilters(query: any, period: string, groupId?: string) {
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
  }

  async getKpis(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);

    const totalTickets = await qb.getCount();
    
    const resolvedTickets = await qb.clone().andWhere('ticket.state_id IN (:...states)', { states: [4, 5] }).getCount();
    const pendingTickets = await qb.clone().andWhere('ticket.state_id = :stateId', { stateId: 3 }).getCount();
    
    // Avg resolution time
    const resolvedData = await qb.clone().andWhere('ticket.state_id IN (:...states)', { states: [4, 5] }).getMany();
    
    let avgResolutionTimeHours = 0;
    if (resolvedData.length > 0) {
      const totalTimeMs = resolvedData.reduce((acc, ticket) => {
        const diffMs = ticket.updated_at.getTime() - ticket.created_at.getTime();
        return acc + diffMs;
      }, 0);
      avgResolutionTimeHours = (totalTimeMs / resolvedData.length) / (1000 * 60 * 60);
    }
    
    // CSAT
    const ticketsWithCsat = await qb.clone().andWhere('ticket.satisfaction_score IS NOT NULL').getMany();
    let csatScore = 0;
    if (ticketsWithCsat.length > 0) {
      const totalCsat = ticketsWithCsat.reduce((acc, ticket) => acc + (ticket.satisfaction_score || 0), 0);
      csatScore = totalCsat / ticketsWithCsat.length;
    }

    return {
      totalTickets,
      resolvedTickets,
      pendingTickets,
      avgResolutionTimeHours: avgResolutionTimeHours.toFixed(1),
      csatScore: csatScore.toFixed(1)
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

  async getTicketsTimeline(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);

    // Group by Date for opened tickets
    const openedRaw = await qb.clone()
      .select("TO_CHAR(ticket.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy("TO_CHAR(ticket.created_at, 'YYYY-MM-DD')")
      .orderBy("date", 'ASC')
      .getRawMany();

    // Group by Date for resolved tickets
    const resolvedRaw = await qb.clone()
      .andWhere('ticket.state_id IN (:...states)', { states: [4, 5] })
      .select("TO_CHAR(ticket.updated_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy("TO_CHAR(ticket.updated_at, 'YYYY-MM-DD')")
      .orderBy("date", 'ASC')
      .getRawMany();

    // Map by date
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

    // Convert map to array and sort by date
    const timeline = Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      opened: counts.opened,
      resolved: counts.resolved
    })).sort((a, b) => a.date.localeCompare(b.date));

    return timeline;
  }

  async getAgentProductivity(period: string, groupId?: string) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    this.applyFilters(qb, period, groupId);
    qb.andWhere('ticket.state_id IN (:...states)', { states: [4, 5] });
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
    })).sort((a, b) => b.count - a.count); // sort descending
  }

  async exportCsv(period: string, groupId?: string): Promise<string> {
    const qb = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.group', 'group')
      .leftJoinAndSelect('ticket.customer', 'customer')
      .leftJoinAndSelect('ticket.owner', 'owner');
      
    this.applyFilters(qb, period, groupId);
    
    const tickets = await qb.orderBy('ticket.created_at', 'DESC').getMany();
    
    const header = ['ID', 'Titulo', 'Status', 'Grupo', 'Cliente', 'Agente', 'Criado Em', 'Atualizado Em', 'Nota Satisfacao'].join(',');
    const rows = tickets.map(t => {
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        this.statusNames[String(t.state_id)] || t.state_id,
        `"${t.group?.name || ''}"`,
        `"${t.customer?.firstname || t.customer?.login || ''}"`,
        `"${t.owner?.firstname || t.owner?.login || ''}"`,
        t.created_at.toISOString(),
        t.updated_at.toISOString(),
        t.satisfaction_score || ''
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
