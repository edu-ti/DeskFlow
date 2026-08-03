<template>
  <div class="min-h-screen flex items-center justify-center bg-df-bg relative overflow-hidden">
    <!-- Background Decorators -->
    <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-df-primary/20 rounded-full blur-[100px] animate-pulse"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-df-accent/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s;"></div>

    <div class="glass-panel w-full max-w-md p-8 rounded-2xl z-10 mx-4 transition-all duration-500 hover:shadow-df-primary/20 hover:shadow-2xl">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-df-primary/20 text-df-primary mb-4">
          <TicketIcon class="w-8 h-8" />
        </div>
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-df-text to-df-text-muted">
          DeskFlow
        </h1>
        <p class="text-sm text-df-text-muted mt-2">Sign in to your workspace</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-df-text-muted mb-2">Email Address</label>
          <div class="relative">
            <MailIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-df-text-muted/50" />
            <input 
              v-model="email" 
              type="email" 
              class="w-full bg-df-bg/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-df-text placeholder-df-text-muted/30 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="agent@deskflow.app"
              required
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-df-text-muted mb-2">Password</label>
          <div class="relative">
            <LockIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-df-text-muted/50" />
            <input 
              v-model="password" 
              type="password" 
              class="w-full bg-df-bg/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-df-text placeholder-df-text-muted/30 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="••••••••"
              required
            >
          </div>
        </div>

        <button 
          type="submit" 
          class="w-full py-3 bg-df-primary hover:bg-df-primary-hover text-white rounded-lg font-medium transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
          :disabled="isLoading"
        >
          <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
          <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket as TicketIcon, Mail as MailIcon, Lock as LockIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  
  // Fake login delay for presentation
  setTimeout(() => {
    isLoading.value = false
    router.push('/tickets')
  }, 1200)
}
</script>
