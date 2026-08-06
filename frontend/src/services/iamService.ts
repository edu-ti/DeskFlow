import api from './api'

export const iamService = {
  async getUsers() {
    const response = await api.get('/iam/users')
    return response.data
  },
  async getGroups() {
    const response = await api.get('/iam/groups')
    return response.data
  },
  async getRoles() {
    const response = await api.get('/iam/roles')
    return response.data
  }
}
