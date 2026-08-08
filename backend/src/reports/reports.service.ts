import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
  ) {}

  async getDashboardStats(startDate?: Date, endDate?: Date) {
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { created_at: Between(startDate, endDate) };
    }

    const allTickets = await this.ticketRepo.find({ 
      where: dateFilter,
      relations: { owner: true, articles: true }
    });

    const totalTickets = allTickets.length;
    
    const getStateName = (id: number) => {
      switch (id) {
        case 1: return 'New';
        case 2: return 'Open';
        case 3: return 'Pending Reminder';
        case 4: return 'Closed';
        default: return 'Unknown';
      }
    };

    // Status Mix
    const byStatus = allTickets.reduce((acc, ticket) => {
      const stateName = getStateName(ticket.state_id);
      acc[stateName] = (acc[stateName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const breachedSla = allTickets.filter(t => t.isEscalated).length;

    // Daily volume for line chart (Last X days based on filter)
    const dailyVolume = allTickets.reduce((acc, ticket) => {
      const date = ticket.created_at.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedDates = Object.keys(dailyVolume).sort();
    const timeline = sortedDates.map(date => ({ date, count: dailyVolume[date] }));

    // Agents with most resolved tickets
    const closedByAgentRaw = allTickets
      .filter(t => t.state_id === 5 && t.owner)
      .reduce((acc, ticket) => {
        const name = `${ticket.owner.firstname} ${ticket.owner.lastname}`;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const closedByAgent = Object.keys(closedByAgentRaw)
      .map(name => ({ name, count: closedByAgentRaw[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // TMR - Tempo Médio de Resposta (Minutos)
    let totalResponseTimeMinutes = 0;
    let respondedTicketsCount = 0;

    allTickets.forEach(ticket => {
      // Considera a primeira nota do agente no ticket
      if (ticket.articles && ticket.articles.length > 1) { // 1st is usually the creation
        const firstAgentReply = ticket.articles.find(a => a.type === 'note' && !a.is_internal && a.created_at > ticket.created_at);
        if (firstAgentReply) {
          const diffMs = firstAgentReply.created_at.getTime() - ticket.created_at.getTime();
          totalResponseTimeMinutes += diffMs / (1000 * 60);
          respondedTicketsCount++;
        }
      }
    });

    const avgResponseTime = respondedTicketsCount > 0 
      ? Math.round(totalResponseTimeMinutes / respondedTicketsCount) 
      : 0;

    return {
      overview: {
        totalTickets,
        openTickets: allTickets.filter(t => t.state_id !== 5).length,
        resolvedTickets: allTickets.filter(t => t.state_id === 5).length,
        breachedSla,
      },
      byStatus,
      timeline,
      closedByAgent,
      avgResponseTime
    };
  }

  async exportTicketsCsv(startDate?: Date, endDate?: Date): Promise<string> {
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { created_at: Between(startDate, endDate) };
    }
    const tickets = await this.ticketRepo.find({ 
      where: dateFilter,
      relations: { customer: true, owner: true, group: true }
    });

    const header = 'ID,Titulo,Status,Criado Em,Cliente,Agente,Grupo,Escalonado\n';
    const rows = tickets.map(t => {
      const status = t.state_id === 1 ? 'Triagem' : t.state_id === 2 ? 'Aberto' : t.state_id === 3 ? 'Em Atendimento' : t.state_id === 4 ? 'Pendente' : t.state_id === 5 ? 'Resolvido' : 'Dúvida';
      const title = t.title ? t.title.replace(/"/g, '""') : '';
      const customerName = t.customer ? `${t.customer.firstname} ${t.customer.lastname}` : '';
      const ownerName = t.owner ? `${t.owner.firstname} ${t.owner.lastname}` : '';
      return `${t.id},"${title}",${status},${t.created_at.toISOString()},"${customerName}","${ownerName}","${t.group?.name || ''}",${t.isEscalated}`;
    });
    return header + rows.join('\n');
  }
}
