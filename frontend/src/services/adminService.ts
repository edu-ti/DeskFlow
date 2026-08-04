import api from './api'

export const adminService = {
  // Users
  async getUsers() {
    const response = await api.get('/users')
    return response.data
  },
  async createUser(data: any) {
    const response = await api.post('/users', data)
    return response.data
  },
  async updateUser(id: number, data: any) {
    const response = await api.patch(`/users/${id}`, data)
    return response.data
  },
  async deleteUser(id: number) {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Groups
  async getGroups() {
    const response = await api.get('/groups')
    return response.data
  },
  async createGroup(data: any) {
    const response = await api.post('/groups', data)
    return response.data
  },
  async updateGroup(id: number, data: any) {
    const response = await api.patch(`/groups/${id}`, data)
    return response.data
  },
  async deleteGroup(id: number) {
    const response = await api.delete(`/groups/${id}`)
    return response.data
  },

  // Roles (Readonly for now)
  async getRoles() {
    // Assuming we'll need this for the user form
    const response = await api.get('/iam/roles') // We don't have this yet, wait, we do in IamController?
    return response.data
  }
}
