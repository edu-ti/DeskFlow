<template>
  <div class="min-h-screen bg-df-bg flex">
    <!-- Sidebar -->
    <aside class="w-64 glass-panel border-y-0 border-l-0 flex flex-col z-20">
      <div class="h-16 flex items-center px-6 border-b border-white/5">
        <TicketIcon class="w-6 h-6 text-df-primary mr-3" />
        <span class="text-lg font-bold text-df-text">DeskFlow</span>
      </div>

      <nav class="flex-1 py-6 px-3 space-y-1">
        <router-link 
          to="/dashboard" 
          class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
          active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
        >
          <LayoutDashboardIcon class="w-5 h-5 mr-3" />
          <span class="font-medium">Dashboard</span>
        </router-link>

        <router-link 
          to="/tickets" 
          class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
          active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
        >
          <InboxIcon class="w-5 h-5 mr-3" />
          <span class="font-medium">All Tickets</span>
        </router-link>
        
        <a href="#" class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors">
          <UsersIcon class="w-5 h-5 mr-3" />
          <span class="font-medium">Customers</span>
        </a>

        <template v-if="isAdmin">
          <div class="pt-6 pb-2 px-3">
            <p class="text-xs font-semibold text-df-text-muted uppercase tracking-wider">Administration</p>
          </div>
          <router-link 
            to="/admin/users" 
            class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
            active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
          >
            <ShieldIcon class="w-5 h-5 mr-3" />
            <span class="font-medium">Users</span>
          </router-link>
          <router-link 
            to="/admin/groups" 
            class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
            active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
          >
            <FolderKeyIcon class="w-5 h-5 mr-3" />
            <span class="font-medium">Groups</span>
          </router-link>
        </template>
      </nav>

      <div class="p-4 border-t border-white/5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-df-primary to-df-accent flex items-center justify-center text-white font-bold text-sm shadow-lg">
            AG
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-df-text truncate">{{ userName }}</p>
            <p class="text-xs text-df-text-muted truncate">{{ isAdmin ? 'Administrator' : 'Agent' }}</p>
          </div>
          <button @click="logout" class="p-1.5 text-df-text-muted hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Logout">
            <LogOutIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <!-- Topbar -->
      <header class="h-16 glass-panel border-t-0 border-x-0 border-b border-white/5 flex items-center justify-between px-8 z-10">
        <div class="flex items-center text-df-text-muted">
          <SearchIcon class="w-5 h-5 mr-2" />
          <input 
            type="text" 
            placeholder="Search tickets (e.g. #1234)..." 
            class="bg-transparent border-none focus:outline-none text-df-text placeholder-df-text-muted/50 w-64 text-sm"
          >
        </div>
        
        <div class="flex items-center gap-4">
          <button class="relative p-2 text-df-text-muted hover:text-white transition-colors">
            <BellIcon class="w-5 h-5" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-df-accent rounded-full"></span>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-8 relative">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket as TicketIcon, Inbox as InboxIcon, Users as UsersIcon, Search as SearchIcon, Bell as BellIcon, LogOut as LogOutIcon, LayoutDashboard as LayoutDashboardIcon, Shield as ShieldIcon, FolderKey as FolderKeyIcon } from 'lucide-vue-next'

const router = useRouter()
const isAdmin = ref(false)
const userName = ref('')

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userName.value = user.firstname || user.email
      if (user.roles && user.roles.includes('admin')) {
        isAdmin.value = true
      }
    } catch(e) {}
  }
})

const logout = () => {
  router.push('/login')
}
</script>
