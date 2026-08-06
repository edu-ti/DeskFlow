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
        
        <router-link 
          to="/kb" 
          class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
          active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
        >
          <BookOpenIcon class="w-5 h-5 mr-3" />
          <span class="font-medium">Knowledge Base</span>
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
          <router-link 
            to="/admin/custom-fields" 
            class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
            active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
          >
            <SettingsIcon class="w-5 h-5 mr-3" />
            <span class="font-medium">Custom Fields</span>
          </router-link>
          <router-link 
            to="/admin/kb" 
            class="flex items-center px-3 py-2.5 rounded-lg text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors group"
            active-class="bg-df-primary/10 text-df-primary hover:text-df-primary hover:bg-df-primary/20"
          >
            <BookOpenIcon class="w-5 h-5 mr-3" />
            <span class="font-medium">KB Management</span>
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
        
        <div class="flex items-center gap-4 relative">
          <!-- Notification Bell -->
          <button @click="toggleNotifications" class="relative p-2 text-df-text-muted hover:text-white transition-colors">
            <BellIcon class="w-5 h-5" />
            <span v-if="notificationsStore.unreadCount > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-df-accent rounded-full border border-df-bg"></span>
          </button>
          
          <!-- Notifications Dropdown -->
          <div v-if="showNotifications" class="absolute top-12 right-0 w-80 bg-df-card border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
            <div class="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
              <span class="font-semibold text-sm text-white">Notifications</span>
              <button @click="notificationsStore.markAllAsRead" class="text-xs text-df-primary hover:text-df-accent transition-colors">Mark all as read</button>
            </div>
            <div class="max-h-96 overflow-y-auto">
              <div v-if="notificationsStore.notifications.length === 0" class="p-4 text-center text-sm text-df-text-muted">
                No notifications
              </div>
              <div 
                v-for="notification in notificationsStore.notifications" 
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                :class="{ 'opacity-60': notification.isRead, 'bg-df-primary/5': !notification.isRead }"
              >
                <div class="flex justify-between items-start mb-1">
                  <span class="font-medium text-sm text-white">{{ notification.title }}</span>
                  <span v-if="!notification.isRead" class="w-2 h-2 rounded-full bg-df-accent mt-1.5"></span>
                </div>
                <p class="text-xs text-df-text-muted line-clamp-2">{{ notification.message }}</p>
                <span class="text-[10px] text-df-text-muted/60 mt-2 block">
                  {{ new Date(notification.createdAt).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-8 relative" @click="closeNotifications">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket as TicketIcon, Inbox as InboxIcon, Users as UsersIcon, Search as SearchIcon, Bell as BellIcon, LogOut as LogOutIcon, LayoutDashboard as LayoutDashboardIcon, Shield as ShieldIcon, FolderKey as FolderKeyIcon, Settings as SettingsIcon, BookOpen as BookOpenIcon } from 'lucide-vue-next'
import { socketService } from '@/services/socketService'
import { useNotificationsStore } from '@/stores/notificationsStore'
import ToastNotification from '@/components/ui/ToastNotification.vue'

const router = useRouter()
const isAdmin = ref(false)
const userName = ref('')

const notificationsStore = useNotificationsStore()
const showNotifications = ref(false)

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
  
  socketService.connect()
  notificationsStore.fetchNotifications()
})

onUnmounted(() => {
  socketService.disconnect()
})

const logout = () => {
  socketService.disconnect()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

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
