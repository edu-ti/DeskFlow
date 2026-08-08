<template>
  <div class="min-h-screen bg-gray-50 flex flex-col font-sans">
    <!-- Top Navigation Bar -->
    <header class="bg-[#0b1c3c] text-white shadow-md relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          
          <!-- Logo & Nav Links -->
          <div class="flex items-center gap-8">
            <div class="flex-shrink-0 flex items-center">
              <img src="@/assets/logo.png" alt="DeskFlow Logo" class="h-8 w-auto bg-white rounded p-1 object-contain">
            </div>
            <nav class="hidden sm:flex space-x-4">
              <router-link to="/portal" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" active-class="bg-[#1a2f5c] text-white">
                Meus Chamados
              </router-link>
              <router-link to="/portal/new" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" active-class="bg-[#1a2f5c] text-white">
                Novo Chamado
              </router-link>
              <router-link to="/portal/kb" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors" active-class="bg-[#1a2f5c] text-white">
                Base de Conhecimento
              </router-link>
            </nav>
          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3 cursor-pointer group">
              <div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-blue-400 transition-colors">
                {{ userInitials }}
              </div>
              <div class="hidden sm:block text-sm">
                <p class="font-medium text-white">{{ userName }}</p>
                <p class="text-xs text-gray-400">Cliente</p>
              </div>
            </div>
            
            <button @click="logout" class="p-2 text-gray-300 hover:text-red-400 hover:bg-[#1a2f5c] rounded-full transition-colors" title="Sair">
              <LogOutIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut as LogOutIcon } from 'lucide-vue-next'

const router = useRouter()
const user = ref<any>(null)

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      user.value = JSON.parse(userStr)
    } catch (e) {}
  }
})

const userName = computed(() => {
  return user.value?.firstname || user.value?.email || ''
})

const userInitials = computed(() => {
  if (!user.value) return '?'
  const f = user.value.firstname?.charAt(0) || ''
  const l = user.value.lastname?.charAt(0) || ''
  const result = (f + l).toUpperCase()
  return result || userName.value.charAt(0).toUpperCase()
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>
