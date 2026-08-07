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

    const allTickets = await this.ticketRepo.find({ where: dateFilter });

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

    // Sort dates
    const sortedDates = Object.keys(dailyVolume).sort();
    const timeline = sortedDates.map(date => ({ date, count: dailyVolume[date] }));

    return {
      overview: {
        totalTickets,
        openTickets: allTickets.filter(t => t.state_id !== 4).length,
        resolvedTickets: allTickets.filter(t => t.state_id === 4).length,
        breachedSla,
      },
      byStatus,
      timeline
    };
  }
}
