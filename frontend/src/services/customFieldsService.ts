import api from './api';

export interface CustomField {
  id: number;
  name: string;
  type: string;
  options: string;
  is_required: boolean;
  group_id: number | null;
}

export const customFieldsService = {
  async getCustomFields(groupId?: number) {
    const params = groupId ? { groupId } : {};
    const response = await api.get('/custom-fields', { params });
    return response.data;
  },

  async createCustomField(data: Partial<CustomField>) {
    const response = await api.post('/custom-fields', data);
    return response.data;
  },

  async updateCustomField(id: number, data: Partial<CustomField>) {
    const response = await api.patch(`/custom-fields/${id}`, data);
    return response.data;
  },

  async deleteCustomField(id: number) {
    const response = await api.delete(`/custom-fields/${id}`);
    return response.data;
  }
};
