import api from './api'

export interface CreateTicketData {
  title: string;
  initial_article_body: string;
  custom_fields?: { field_id: number; value: string }[];
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

  async getDashboardStats() {
    const response = await api.get('/tickets/stats')
    return response.data
  }
}
