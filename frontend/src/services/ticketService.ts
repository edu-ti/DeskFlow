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
  }
}
