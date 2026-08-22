import api from './api'

export interface Device {
  id: number;
  name: string;
  organization_id?: number | null;
  organization?: any;
  assigned_user_id?: number | null;
  assigned_user?: any;
  device_type?: string;
  os_name?: string;
  ip_address?: string;
  mac_address?: string;
  cpu_model?: string;
  cpu_usage_percent?: number | null;
  ram_total_gb?: number | null;
  ram_usage_percent?: number | null;
  disk_total_gb?: number | null;
  disk_used_gb?: number | null;
  disk_usage_percent?: number | null;
  status: 'online' | 'warning' | 'critical' | 'offline';
  agent_version?: string;
  last_heartbeat_at?: string;
  created_at: string;
}

export interface DeviceAlert {
  id: number;
  device_id: number;
  device?: Device;
  alert_type: string;
  severity: 'warning' | 'critical';
  message: string;
  ticket_id?: number | null;
  ticket?: any;
  is_resolved: boolean;
  created_at: string;
}

export const rmmService = {
  async getDevices(filter?: { organization_id?: number; status?: string; search?: string }): Promise<Device[]> {
    const res = await api.get('/rmm/devices', { params: filter });
    return res.data;
  },

  async getDeviceById(id: number): Promise<Device> {
    const res = await api.get(`/rmm/devices/${id}`);
    return res.data;
  },

  async createDevice(data: Partial<Device>): Promise<Device> {
    const res = await api.post('/rmm/devices', data);
    return res.data;
  },

  async updateDevice(id: number, data: Partial<Device>): Promise<Device> {
    const res = await api.put(`/rmm/devices/${id}`, data);
    return res.data;
  },

  async deleteDevice(id: number): Promise<{ success: boolean }> {
    const res = await api.delete(`/rmm/devices/${id}`);
    return res.data;
  },

  async getAlerts(filter?: { device_id?: number; is_resolved?: boolean }): Promise<DeviceAlert[]> {
    const res = await api.get('/rmm/alerts', { params: filter });
    return res.data;
  },

  async resolveAlert(id: number): Promise<DeviceAlert> {
    const res = await api.patch(`/rmm/alerts/${id}/resolve`);
    return res.data;
  },

  async getAgentScript(organizationId?: number): Promise<{ script: string; serverUrl: string }> {
    const res = await api.get('/rmm/agent-script', { params: { organization_id: organizationId } });
    return res.data;
  },
}
