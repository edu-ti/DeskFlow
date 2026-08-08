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
  closedByAgent: { name: string, count: number }[];
  avgResponseTime: number;
}

export const reportsService = {
  async getDashboardStats(days?: number): Promise<DashboardStats> {
    const params = days ? { days } : {};
    const res = await api.get('/reports/dashboard-stats', { params });
    return res.data;
  },
  
  async exportCsv(days?: number) {
    const params = days ? { days } : {};
    const res = await api.get('/reports/export', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tickets-export.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
}
