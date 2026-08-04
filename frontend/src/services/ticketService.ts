import api from './api'

export interface CreateTicketData {
  title: string;
  initial_article_body: string;
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

  async addArticle(ticketId: number, body: string) {
    const response = await api.post(`/tickets/${ticketId}/articles`, { body })
    return response.data
  },

  async getDashboardStats() {
    const response = await api.get('/tickets/stats')
    return response.data
  }
}
