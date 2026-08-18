import api from './api'

export const textModulesService = {
  async getAll() {
    const response = await api.get('/text-modules')
    return response.data
  },
  async getActive() {
    const response = await api.get('/text-modules/active')
    return response.data
  },
  async create(data: any) {
    const response = await api.post('/text-modules', data)
    return response.data
  },
  async update(id: number, data: any) {
    const response = await api.patch(`/text-modules/${id}`, data)
    return response.data
  },
  async remove(id: number) {
    const response = await api.delete(`/text-modules/${id}`)
    return response.data
  }
}
