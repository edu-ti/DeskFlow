import api from './api';

export interface CallState {
  callId: string;
  phoneId?: string;
  direction: 'USER_INITIATED' | 'BUSINESS_INITIATED';
  status: string;
  from: string;
  to: string;
  callerName?: string;
  sdp?: string;
  startedAt?: number;
}

class CallingService {
  async getActiveCalls(): Promise<CallState[]> {
    const res = await api.get('/whatsapp/calling/calls');
    return res.data;
  }

  async initiateCall(dto: { to: string; sdp: string; biz_opaque_callback_data?: string }) {
    const res = await api.post('/whatsapp/calling/calls', dto);
    return res.data as { success: boolean; callId?: string; meta?: any };
  }

  async callAction(dto: { callId: string; action: string; sdp?: string }) {
    const res = await api.post('/whatsapp/calling/actions', dto);
    return res.data;
  }

  async getCallPermission(userWaId: string) {
    const res = await api.get(`/whatsapp/calling/permissions/${encodeURIComponent(userWaId)}`);
    return res.data;
  }

  async getEligibility() {
    const res = await api.get('/whatsapp/calling/eligibility');
    return res.data;
  }

  async getSettings() {
    const res = await api.get('/whatsapp/calling/settings');
    return res.data;
  }

  async updateSettings(dto: any) {
    const res = await api.put('/whatsapp/calling/settings', dto);
    return res.data;
  }

  async getConsent(userWaId: string) {
    const res = await api.get(`/whatsapp/calling/consent/${encodeURIComponent(userWaId)}`);
    return res.data;
  }

  async recordConsent(dto: { user_wa_id: string; method?: string }) {
    const res = await api.post('/whatsapp/calling/consent', dto);
    return res.data;
  }

  async revokeConsent(userWaId: string) {
    const res = await api.delete(`/whatsapp/calling/consent/${encodeURIComponent(userWaId)}`);
    return res.data;
  }

  async listLogs(query: { page?: number; limit?: number; ticket_id?: number } = {}) {
    const res = await api.get('/whatsapp/calling/logs', { params: query });
    return res.data;
  }

  async deleteLog(id: number) {
    const res = await api.delete(`/whatsapp/calling/logs/${id}`);
    return res.data;
  }

  async purgeLogs() {
    const res = await api.post('/whatsapp/calling/maintenance/purge');
    return res.data;
  }
}

export const callingService = new CallingService();