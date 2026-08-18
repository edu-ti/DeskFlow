import api from './api'

export const tagsService = {
  async getAll() {
    const response = await api.get('/tags')
    return response.data
  },
  async create(data: any) {
    const response = await api.post('/tags', data)
    return response.data
  },
  async update(id: number, data: any) {
    const response = await api.patch(`/tags/${id}`, data)
    return response.data
  },
  async remove(id: number) {
    const response = await api.delete(`/tags/${id}`)
    return response.data
  },
  async getTicketTags(ticketId: number) {
    const response = await api.get(`/tags/ticket/${ticketId}`)
    return response.data
  },
  async assign(ticketId: number, name: string) {
    const response = await api.post(`/tags/ticket/${ticketId}`, { name })
    return response.data
  },
  async removeFromTicket(ticketId: number, tagId: number) {
    const response = await api.delete(`/tags/ticket/${ticketId}/${tagId}`)
    return response.data
  }
}
