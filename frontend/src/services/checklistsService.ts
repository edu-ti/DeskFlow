import api from './api'

export const checklistsService = {
  async getTicketChecklist(ticketId: number) {
    const response = await api.get(`/checklists/ticket/${ticketId}`)
    return response.data
  },
  async ensure(ticketId: number, name?: string) {
    const response = await api.post(`/checklists/ticket/${ticketId}`, { name })
    return response.data
  },
  async addItem(ticketId: number, text: string) {
    const response = await api.post(`/checklists/ticket/${ticketId}/items`, { text })
    return response.data
  },
  async toggleItem(itemId: number) {
    const response = await api.patch(`/checklists/items/${itemId}/toggle`)
    return response.data
  },
  async updateItem(itemId: number, data: any) {
    const response = await api.patch(`/checklists/items/${itemId}`, data)
    return response.data
  },
  async removeItem(itemId: number) {
    const response = await api.delete(`/checklists/items/${itemId}`)
    return response.data
  },
  async removeChecklist(checklistId: number) {
    const response = await api.delete(`/checklists/${checklistId}`)
    return response.data
  }
}
