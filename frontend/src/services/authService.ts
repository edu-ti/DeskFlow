import api from './api';

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
  }
}

export const authService = {
  async login(credentials: any): Promise<LoginResponse> {
    const response = await api.post('/iam/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
