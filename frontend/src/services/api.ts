import axios from 'axios'
import { useToast } from '../composables/useToast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Adiciona o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { error: toastError } = useToast()
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (error.response.status >= 500) {
        toastError('Erro no Servidor', 'Ocorreu um erro interno. Tente novamente mais tarde.')
      } else if (error.response.status === 403) {
        toastError('Acesso Negado', 'Você não tem permissão para realizar esta ação.')
      } else {
        const message = error.response.data?.message || 'Ocorreu um erro na requisição.'
        toastError('Erro', Array.isArray(message) ? message[0] : message)
      }
    } else if (error.request) {
      toastError('Sem Conexão', 'Não foi possível conectar ao servidor.')
    } else {
      toastError('Erro', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
