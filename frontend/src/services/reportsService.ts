import api from './api'

export interface DashboardOverview {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  breachedSla: number;
}

export interface TimelineData {
  date: string;
  count: number;
}

export interface DashboardStats {
  overview: DashboardOverview;
  byStatus: Record<string, number>;
  timeline: TimelineData[];
}

export const reportsService = {
  async getDashboardStats(days?: number): Promise<DashboardStats> {
    const params = days ? { days } : {};
    const res = await api.get('/reports/dashboard-stats', { params });
    return res.data;
  }
}
