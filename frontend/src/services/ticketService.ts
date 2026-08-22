import api from './api'

export interface CreateTicketData {
  title: string;
  initial_article_body: string;
  custom_fields?: { field_id: number; value: string }[];
  customer_id?: number;
  group_id?: number;
  priority_id?: number;
  service_type?: string;
}

export const ticketService = {
  async getTickets() {
    const response = await api.get('/tickets')
    return response.data
  },

  async createTicket(data: CreateTicketData) {
    const response = await api.post('/tickets', data)
    return response.data
  },

  async getTicketById(id: number) {
    const response = await api.get(`/tickets/${id}`)
    return response.data
  },

  async addArticle(ticketId: number, body: string, is_internal: boolean = false) {
    const response = await api.post(`/tickets/${ticketId}/articles`, { body, is_internal })
    return response.data
  },

  async changeState(ticketId: number, stateId: number) {
    const response = await api.patch(`/tickets/${ticketId}/state`, { state_id: stateId })
    return response.data
  },

  async assignTicket(ticketId: number, ownerId: number | null) {
    const response = await api.patch(`/tickets/${ticketId}/assign`, { owner_id: ownerId })
    return response.data
  },

  async changeServiceType(ticketId: number, serviceType: string) {
    const response = await api.patch(`/tickets/${ticketId}/service-type`, { service_type: serviceType })
    return response.data
  },

  async getDashboardStats() {
    const response = await api.get('/tickets/stats')
    return response.data
  },

  async searchTickets(query: string) {
    const response = await api.get(`/tickets/search`, { params: { q: query } })
    return response.data
  }
}
