<template>
  <div class="min-h-screen bg-df-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Glow Effects -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-df-primary/20 rounded-full blur-[128px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-df-accent/10 rounded-full blur-[128px] pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10">
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 mb-4">
          <TicketIcon class="w-8 h-8 text-df-primary" />
          <span class="text-2xl font-bold tracking-tight text-white">Desk<span class="text-df-primary">Flow</span></span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p class="text-df-text-muted">Enter your credentials to access your workspace</p>
      </div>

      <div class="glass-panel p-8 rounded-2xl">
        <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3 text-red-400">
          <AlertCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p class="text-sm font-medium">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-2">Email address</label>
            <input 
              v-model="email"
              type="email" 
              class="w-full bg-df-bg/50 border border-white/10 rounded-xl py-3 px-4 text-df-text placeholder-df-text-muted/30 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="admin@example.com"
              required
            >
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-df-text-muted">Password</label>
              <a href="#" class="text-xs text-df-primary hover:text-df-primary-hover font-medium">Forgot?</a>
            </div>
            <input 
              v-model="password"
              type="password" 
              class="w-full bg-df-bg/50 border border-white/10 rounded-xl py-3 px-4 text-df-text focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="••••••••"
              required
            >
          </div>

          <button 
            type="submit" 
            class="w-full bg-df-primary hover:bg-df-primary-hover text-white py-3 px-4 rounded-xl font-medium transition-all transform active:scale-[0.98] shadow-lg shadow-df-primary/20 flex justify-center items-center gap-2 mt-2"
            :disabled="isLoading"
          >
            <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
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
    
    router.push('/tickets')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Failed to authenticate. Check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>
