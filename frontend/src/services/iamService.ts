import api from './api'

export interface UserProfile {
  id: number
  login: string
  firstname: string
  lastname: string
  email: string
  phone?: string | null
  job_title?: string | null
  department?: string | null
  unit?: string | null
  avatar_url?: string | null
  preferences?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  roles?: Array<{ id: number; name: string }>
  groups?: Array<{ id: number; name: string }>
  organization?: { id: number; name: string } | null
}

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
  },
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/iam/profile')
    return response.data
  },
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put('/iam/profile', data)
    return response.data
  },
  async changePassword(current_password: string, new_password: string): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/iam/change-password', { current_password, new_password })
    return response.data
  }
}
