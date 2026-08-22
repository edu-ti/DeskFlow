import api from './api'

export interface FieldActivity {
  id: number;
  ticket_id?: number | null;
  ticket?: any;
  technician_id?: number | null;
  technician?: any;
  organization_id?: number | null;
  organization?: any;
  title: string;
  description?: string;
  scheduled_at: string;
  estimated_duration_mins: number;
  status: 'scheduled' | 'traveling' | 'in_progress' | 'completed' | 'cancelled';
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  checkin_at?: string | null;
  checkout_at?: string | null;
  checkin_notes?: string | null;
  checkout_notes?: string | null;
  created_at: string;
}

export const fieldService = {
  async getActivities(filter?: {
    technician_id?: number;
    organization_id?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<FieldActivity[]> {
    const res = await api.get('/field-service/activities', { params: filter });
    return res.data;
  },

  async getActivityById(id: number): Promise<FieldActivity> {
    const res = await api.get(`/field-service/activities/${id}`);
    return res.data;
  },

  async createActivity(data: Partial<FieldActivity>): Promise<FieldActivity> {
    const res = await api.post('/field-service/activities', data);
    return res.data;
  },

  async updateActivity(id: number, data: Partial<FieldActivity>): Promise<FieldActivity> {
    const res = await api.put(`/field-service/activities/${id}`, data);
    return res.data;
  },

  async checkIn(id: number, data: { notes?: string; latitude?: number; longitude?: number }): Promise<FieldActivity> {
    const res = await api.patch(`/field-service/activities/${id}/check-in`, data);
    return res.data;
  },

  async checkOut(id: number, data: { notes?: string }): Promise<FieldActivity> {
    const res = await api.patch(`/field-service/activities/${id}/check-out`, data);
    return res.data;
  },

  async deleteActivity(id: number): Promise<{ success: boolean }> {
    const res = await api.delete(`/field-service/activities/${id}`);
    return res.data;
  },
}
