<template>
  <div class="h-screen bg-df-bg flex overflow-hidden">
    <!-- Mobile overlay -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"></div>

    <!-- Sidebar -->
    <aside :class="['bg-df-primary-dark shadow-xl flex flex-col z-50 fixed inset-y-0 left-0 transform transition-all duration-300 md:relative md:translate-x-0', isSidebarCollapsed ? 'w-20' : 'w-64', isSidebarOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="h-16 flex items-center justify-center bg-white border-b border-r border-gray-200 transition-all duration-300" :class="isSidebarCollapsed ? 'px-2' : 'px-6'">
        <img v-if="!isSidebarCollapsed" src="@/assets/logo.png" alt="DeskFlow Logo" class="h-14 w-auto" />
        <img v-else src="/favicon.png" alt="DeskFlow Icon" class="h-12 w-auto" />
      </div>

      <nav class="flex-1 py-6 px-3 space-y-1 overflow-x-hidden">
        <router-link 
          to="/dashboard" 
          class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
          :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
          active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
          title="Painel"
        >
          <LayoutDashboardIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
          <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Painel</span>
        </router-link>

        <router-link 
          to="/omnichannel" 
          class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
          :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
          active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
          title="Atendimento Chat"
        >
          <svg class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Atendimento Chat</span>
        </router-link>

        <router-link 
          to="/tickets" 
          class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
          :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
          active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
          title="Todos os Chamados"
        >
          <InboxIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
          <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Todos os Chamados</span>
        </router-link>
        
        <router-link 
          to="/kb" 
          class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
          :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
          active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
          title="Base de Conhecimento"
        >
          <BookOpenIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
          <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Base de Conhecimento</span>
        </router-link>
        
        <router-link 
          to="/contacts" 
          class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
          :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
          active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
          title="Contatos"
        >
          <UsersIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
          <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Contatos</span>
        </router-link>

        <template v-if="isAdmin">
          <div class="pt-6 pb-2" :class="isSidebarCollapsed ? 'px-0 text-center' : 'px-3'">
            <p v-if="!isSidebarCollapsed" class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administração</p>
            <div v-else class="h-px w-8 mx-auto bg-gray-700"></div>
          </div>
          
          <router-link 
            to="/admin/users" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Usuários"
          >
            <ShieldIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Usuários</span>
          </router-link>
          
          <router-link 
            to="/admin/groups" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Grupos"
          >
            <FolderKeyIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Grupos</span>
          </router-link>

          <router-link 
            to="/admin/organizations" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Organizações"
          >
            <Building2Icon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Organizações</span>
          </router-link>

          <router-link 
            to="/admin/tags" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Etiquetas"
          >
            <TagIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Etiquetas</span>
          </router-link>

          <router-link 
            to="/admin/overviews" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Visões"
          >
            <LayersIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Visões</span>
          </router-link>

          <router-link 
            to="/admin/text-modules" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Respostas Prontas"
          >
            <FileTextIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Respostas Prontas</span>
          </router-link>
          
          <router-link 
            to="/admin/custom-fields" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Campos Extras"
          >
            <SettingsIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Campos Extras</span>
          </router-link>
          
          <router-link 
            to="/admin/kb" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Gestão da Base"
          >
            <BookOpenIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Gestão da Base</span>
          </router-link>
          
          <router-link 
            to="/admin/macros" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Macros"
          >
            <PlayIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Macros</span>
          </router-link>

          <router-link 
            to="/admin/analytics" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Relatórios"
          >
            <BarChart2Icon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Relatórios</span>
          </router-link>
          
          <router-link 
            to="/admin/sla-policies" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Políticas de SLA"
          >
            <ClockIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Políticas de SLA</span>
          </router-link>
          
          <router-link 
            to="/admin/triggers" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Gatilhos"
          >
            <ZapIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Gatilhos</span>
          </router-link>
          
          <router-link 
            to="/admin/settings" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Configurações"
          >
            <SettingsIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Configurações</span>
          </router-link>

          <router-link 
            to="/admin/audit" 
            class="flex items-center py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors group"
            :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-3'"
            active-class="bg-df-primary text-white hover:text-white hover:bg-df-primary"
            title="Auditoria & LGPD"
          >
            <ShieldAlertIcon class="w-5 h-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mr-0' : 'mr-3'" />
            <span v-if="!isSidebarCollapsed" class="font-medium whitespace-nowrap">Auditoria & LGPD</span>
          </router-link>
        </template>
      </nav>

      <div class="p-3 border-t border-white/10">
        <div class="flex items-center transition-all duration-300" :class="isSidebarCollapsed ? 'flex-col gap-3' : 'gap-2'">
          <router-link
            to="/profile"
            class="flex items-center gap-3 flex-1 min-w-0 p-1.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
            :class="isSidebarCollapsed ? 'justify-center' : ''"
            title="Meu Perfil (Configurar foto, dados e senha)"
          >
            <div
              class="w-9 h-9 rounded-full bg-gradient-to-tr from-df-primary to-df-accent flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 bg-cover bg-center overflow-hidden border border-white/20"
              :style="userAvatar ? { backgroundImage: `url(${userAvatar})` } : {}"
            >
              <span v-if="!userAvatar">{{ userInitials }}</span>
            </div>
            <div v-if="!isSidebarCollapsed" class="flex-1 min-w-0 text-left">
              <p class="text-sm font-medium text-white truncate group-hover:text-df-accent transition-colors">{{ userName }}</p>
              <p class="text-xs text-gray-400 truncate">{{ isAdmin ? 'Administrador' : 'Agente' }}</p>
            </div>
          </router-link>
          <button @click="logout" class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0" title="Sair do Sistema">
            <LogOutIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <!-- Topbar -->
      <header class="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-10 flex-shrink-0">
        <div class="flex items-center text-gray-600 flex-1">
          <!-- Mobile Toggle -->
          <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden mr-3 p-1 -ml-1 text-gray-500 hover:text-df-primary transition-colors">
            <MenuIcon class="w-6 h-6" />
          </button>
          <!-- Desktop Toggle -->
          <button @click="isSidebarCollapsed = !isSidebarCollapsed" class="hidden md:block mr-4 p-1 -ml-1 text-gray-500 hover:text-df-primary transition-colors" title="Alternar Menu">
            <MenuIcon class="w-5 h-5" />
          </button>
          
          <!-- Search -->
          <div class="relative w-96">
            <div class="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full">
              <SearchIcon class="w-5 h-5 text-gray-500 mr-2" />
              <input 
                v-model="searchQuery" 
                @input="handleSearchInput" 
                @focus="isSearchFocused = true"
                @blur="handleSearchBlur"
                @keyup.enter="handleSearchEnter"
                type="text" 
                placeholder="Pesquisar chamados, clientes ou artigos..." 
                class="bg-transparent border-none outline-none text-sm w-full"
              >
            </div>
            
            <!-- Search Dropdown Results -->
            <div v-if="isSearchFocused && searchQuery.length >= 2" class="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <div v-if="isSearching" class="p-4 text-center text-sm text-gray-500 flex justify-center items-center">
                <Loader2Icon class="w-4 h-4 mr-2 animate-spin" /> Buscando...
              </div>
              <div v-else-if="searchResults.length === 0" class="p-4 text-center text-sm text-gray-500">
                Nenhum resultado encontrado para "{{ searchQuery }}"
              </div>
              <div v-else class="max-h-96 overflow-y-auto">
                <div v-for="result in searchResults" :key="result.type + '-' + result.id" @mousedown="navigateTo(result.route)" class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg" :class="{
                      'bg-blue-100 text-blue-600': result.type === 'ticket',
                      'bg-purple-100 text-purple-600': result.type === 'article',
                      'bg-green-100 text-green-600': result.type === 'user'
                    }">
                      <TicketIcon v-if="result.type === 'ticket'" class="w-4 h-4" />
                      <BookOpenIcon v-else-if="result.type === 'article'" class="w-4 h-4" />
                      <UsersIcon v-else-if="result.type === 'user'" class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-800">{{ result.title }}</div>
                      <div class="text-xs text-gray-500">{{ result.subtitle }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-4 relative">
          <!-- Notification Bell -->
          <button @click="toggleNotifications" class="relative p-2 text-gray-500 hover:text-df-primary transition-colors">
            <BellIcon class="w-5 h-5" />
            <span v-if="notificationsStore.unreadCount > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-df-accent rounded-full border border-white"></span>
          </button>
          
          <!-- Notifications Dropdown -->
          <div v-if="showNotifications" class="absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
            <div class="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
              <span class="font-semibold text-sm text-gray-800">Notificações</span>
              <button @click="notificationsStore.markAllAsRead" class="text-xs text-df-primary hover:text-df-primary-hover transition-colors">Marcar todas como lidas</button>
            </div>
            <div class="max-h-96 overflow-y-auto">
              <div v-if="notificationsStore.notifications.length === 0" class="p-4 text-center text-sm text-gray-500">
                Sem notificações no momento
              </div>
              <div 
                v-for="notification in notificationsStore.notifications" 
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                :class="{ 'opacity-60': notification.isRead, 'bg-blue-50': !notification.isRead }"
              >
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium text-sm text-gray-800">{{ notification.title }}</span>
                  <span v-if="!notification.isRead" class="w-2 h-2 rounded-full bg-df-accent mt-1.5"></span>
                </div>
                <p class="text-xs text-gray-600 line-clamp-2">{{ notification.message }}</p>
                <span class="text-[10px] text-gray-400 mt-2 block">
                  {{ new Date(notification.createdAt).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-8 relative" @click="closeNotifications">
        <router-view></router-view>
      </div>

      <!-- Toast Container -->
      <ToastNotification 
        :notification="notificationsStore.latestToast" 
        @close="notificationsStore.clearToast" 
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Ticket as TicketIcon, Inbox as InboxIcon, Users as UsersIcon, Search as SearchIcon, Bell as BellIcon, LogOut as LogOutIcon, LayoutDashboard as LayoutDashboardIcon, Shield as ShieldIcon, FolderKey as FolderKeyIcon, Settings as SettingsIcon, BookOpen as BookOpenIcon, Play as PlayIcon, Menu as MenuIcon, Zap as ZapIcon, Loader2 as Loader2Icon, BarChart2 as BarChart2Icon, Clock as ClockIcon, ShieldAlert as ShieldAlertIcon, Building2 as Building2Icon, Tag as TagIcon, Layers as LayersIcon, FileText as FileTextIcon } from 'lucide-vue-next'
import { socketService } from '@/services/socketService'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { searchService, type SearchResult } from '@/services/searchService'
import ToastNotification from '@/components/ui/ToastNotification.vue'

const router = useRouter()
const route = useRoute()
const isAdmin = ref(false)
const userName = ref('')
const userAvatar = ref<string | null>(null)
const userInitials = ref('AD')
const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  isSidebarOpen.value = false
})

const notificationsStore = useNotificationsStore()
const showNotifications = ref(false)

const loadUserData = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userName.value = user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : (user.email || 'Usuário')
      const f = user.firstname || 'A'
      const l = user.lastname || 'D'
      userInitials.value = `${f[0] || ''}${l[0] || ''}`.toUpperCase()
      userAvatar.value = user.avatar_url || null
      if (user.roles && (user.roles.includes('admin') || user.roles.some((r: any) => r.name === 'admin' || r === 'admin'))) {
        isAdmin.value = true
      }
    } catch(e) {}
  }
}

onMounted(() => {
  loadUserData()
  window.addEventListener('user-profile-updated', loadUserData)
  socketService.connect()
  notificationsStore.fetchNotifications()
})

onUnmounted(() => {
  window.removeEventListener('user-profile-updated', loadUserData)
  socketService.disconnect()
})

const logout = () => {
  socketService.disconnect()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

// Search Logic
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isSearching = ref(false)
const isSearchFocused = ref(false)
let searchTimeout: any = null

const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.trim().length >= 2) {
    isSearching.value = true
    searchTimeout = setTimeout(async () => {
      try {
        searchResults.value = await searchService.globalSearch(searchQuery.value)
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        isSearching.value = false
      }
    }, 300)
  } else {
    searchResults.value = []
    isSearching.value = false
  }
}

const handleSearchBlur = () => {
  // Delay blur to allow mousedown on results to fire first
  setTimeout(() => {
    isSearchFocused.value = false
  }, 200)
}

const handleSearchEnter = () => {
  if (searchResults.value.length > 0 && searchResults.value[0]?.route) {
    navigateTo(searchResults.value[0]?.route);
  }
};

const navigateTo = (routePath?: string) => {
  if (routePath) {
    router.push(routePath);
  }
  isSearchFocused.value = false;
  searchQuery.value = '';
  searchResults.value = [];
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const closeNotifications = () => {
  showNotifications.value = false
}

const handleNotificationClick = async (notification: any) => {
  if (!notification.isRead) {
    await notificationsStore.markAsRead(notification.id)
  }
  closeNotifications()
  if (notification.ticketId) {
    router.push(`/tickets/${notification.ticketId}`)
  }
}
</script>

