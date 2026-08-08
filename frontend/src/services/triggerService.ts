import api from './api';

export interface Trigger {
  id?: number;
  name: string;
  description: string;
  is_active: boolean;
  event_type: string;
  conditions: any[];
  actions: any[];
  created_at?: string;
  updated_at?: string;
}

export const triggerService = {
  async getAll(): Promise<Trigger[]> {
    const response = await api.get('/triggers');
    return response.data;
  },

  async getById(id: number): Promise<Trigger> {
    const response = await api.get(`/triggers/${id}`);
    return response.data;
  },

  async create(trigger: Trigger): Promise<Trigger> {
    const response = await api.post('/triggers', trigger);
    return response.data;
  },

  async update(id: number, trigger: Partial<Trigger>): Promise<Trigger> {
    const response = await api.put(`/triggers/${id}`, trigger);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/triggers/${id}`);
  }
};
