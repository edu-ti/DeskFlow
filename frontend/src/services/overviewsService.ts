import api from './api'

export const overviewsService = {
  async getAll() {
    const response = await api.get('/overviews')
    return response.data
  },
  async getAvailable() {
    const response = await api.get('/overviews/available')
    return response.data
  },
  async create(data: any) {
    const response = await api.post('/overviews', data)
    return response.data
  },
  async update(id: number, data: any) {
    const response = await api.patch(`/overviews/${id}`, data)
    return response.data
  },
  async remove(id: number) {
    const response = await api.delete(`/overviews/${id}`)
    return response.data
  }
}
