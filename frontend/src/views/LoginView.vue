<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <div class="flex justify-center mb-6">
          <img src="@/assets/LOGO-VERTICAL.png" alt="DeskFlow Logo" class="h-60 w-auto" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Bem-vindo de volta</h1>
        <p class="text-gray-500">Insira suas credenciais para acessar o sistema</p>
      </div>

      <div class="bg-white border border-gray-200 shadow-xl p-8 rounded-2xl">
        <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3 text-red-400">
          <AlertCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p class="text-sm font-medium">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input 
              v-model="email"
              type="email" 
              class="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="admin@exemplo.com"
              required
            >
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">Senha</label>
              <a href="#" class="text-xs text-df-primary hover:text-df-primary-hover font-medium">Esqueceu a senha?</a>
            </div>
            <input 
              v-model="password"
              type="password" 
              class="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="••••••••"
              required
            >
          </div>

          <button 
            type="submit" 
            class="w-full bg-df-primary hover:bg-df-primary-hover text-white py-2.5 px-4 rounded-lg font-medium transition-all transform active:scale-[0.98] shadow-md flex justify-center items-center gap-2 mt-4"
            :disabled="isLoading"
          >
            <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'Entrando...' : 'Entrar' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket as TicketIcon, AlertCircle as AlertCircleIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import { authService } from '../services/authService'

const router = useRouter()
const email = ref('admin@example.com')
const password = ref('admin123')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    await authService.login({ email: email.value, password: password.value })
    
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.roles && user.roles.length === 1 && user.roles.includes('customer')) {
        router.push('/portal')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Falha ao autenticar. Verifique suas credenciais.'
  } finally {
    isLoading.value = false
  }
}
</script>
