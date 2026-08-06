<template>
  <div class="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex gap-6">
    <!-- Left Column: Ticket Info -->
    <div class="w-1/3 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
      <div v-if="isLoading" class="glass-panel p-6 rounded-2xl flex justify-center">
        <Loader2Icon class="w-6 h-6 text-df-primary animate-spin" />
      </div>
      
      <div v-else-if="ticket" class="glass-panel p-6 rounded-2xl">
        <div class="flex items-center gap-3 mb-4">
          <h1 class="text-xl font-bold text-df-text flex-1">#{{ ticket.id }}</h1>
          
          <select 
            v-if="isAdminOrAgent" 
            v-model="ticket.state_id" 
            @change="updateState"
            class="px-2.5 py-1 bg-df-accent/20 text-df-accent border border-df-accent/30 rounded-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-df-accent appearance-none cursor-pointer"
          >
            <option :value="1">New</option>
            <option :value="2">Open</option>
            <option :value="3">Pending</option>
            <option :value="4">Resolved</option>
            <option :value="5">Closed</option>
          </select>
          <span v-else class="px-2.5 py-1 bg-df-accent/20 text-df-accent rounded-full text-xs font-medium">
            {{ getStatusName(ticket.state_id) }}
          </span>
        </div>
        
        <h2 class="text-lg text-df-text font-medium mb-6">{{ ticket.title }}</h2>

        <div class="space-y-4">
          <div>
            <label class="text-xs text-df-text-muted font-medium uppercase tracking-wider block mb-1">Customer</label>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-df-primary/20 flex items-center justify-center text-df-primary font-bold text-sm">
                {{ getInitials(ticket.customer?.firstname, ticket.customer?.lastname) }}
              </div>
              <div>
                <p class="text-sm text-df-text font-medium">{{ ticket.customer?.firstname }} {{ ticket.customer?.lastname }}</p>
                <p class="text-xs text-df-text-muted">{{ ticket.customer?.email }}</p>
              </div>
            </div>
          </div>
          <div>
            <label class="text-xs text-df-text-muted font-medium uppercase tracking-wider block mb-1">Assignee</label>
            <select 
              v-if="isAdminOrAgent"
              v-model="ticket.owner_id"
              @change="updateAssignee"
              class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-df-text focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary"
            >
              <option :value="null">Unassigned</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.firstname }} {{ agent.lastname }}
              </option>
            </select>
            <div v-else class="flex items-center gap-3">
              <div v-if="ticket.owner" class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-df-primary/20 flex items-center justify-center text-df-primary font-bold text-xs">
                  {{ getInitials(ticket.owner?.firstname, ticket.owner?.lastname) }}
                </div>
                <p class="text-sm text-df-text font-medium">{{ ticket.owner?.firstname }} {{ ticket.owner?.lastname }}</p>
              </div>
              <p v-else class="text-sm text-df-text-muted">Unassigned</p>
            </div>
          </div>

          <div>
            <label class="text-xs text-df-text-muted font-medium uppercase tracking-wider block mb-1">Created At</label>
            <p class="text-sm text-df-text">{{ new Date(ticket.created_at).toLocaleString() }}</p>
          </div>

          <div v-if="ticket.custom_field_values && ticket.custom_field_values.length > 0">
            <div class="h-px bg-white/10 my-4"></div>
            <h3 class="text-xs text-df-text-muted font-medium uppercase tracking-wider mb-3">Additional Details</h3>
            <div class="space-y-3">
              <div v-for="cfValue in ticket.custom_field_values" :key="cfValue.id">
                <label class="text-xs text-df-text-muted font-medium uppercase tracking-wider block mb-1">
                  {{ cfValue.custom_field?.name }}
                </label>
                <p class="text-sm text-df-text">{{ cfValue.value }}</p>
              </div>
            </div>
          </div>

          <div v-if="ticket.firstResponseEscalationAt">
            <label class="text-xs text-df-text-muted font-medium uppercase tracking-wider block mb-1">
              <span v-if="ticket.isEscalated" class="text-red-400">SLA Violated</span>
              <span v-else>SLA Target (Response)</span>
            </label>
            <p class="text-sm" :class="ticket.isEscalated ? 'text-red-400 font-bold' : 'text-df-text'">
              {{ new Date(ticket.firstResponseEscalationAt).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
      
      <div v-else class="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
          <XIcon class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-medium text-df-text">Ticket Not Found</h3>
        <p class="text-sm text-df-text-muted mt-2">This ticket may have been deleted or does not exist.</p>
        <button @click="router.push('/tickets')" class="mt-6 text-df-primary hover:text-df-primary-hover text-sm font-medium">
          &larr; Back to Tickets
        </button>
      </div>

      <div class="flex-1"></div> <!-- Spacer -->
    </div>

    <!-- Right Column: Articles Timeline -->
    <div class="w-2/3 flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-white/5 bg-white/5 flex items-center">
        <h3 class="text-df-text font-medium flex items-center gap-2">
          <MessageSquareIcon class="w-5 h-5 text-df-primary" />
          Conversation
        </h3>
      </div>

      <!-- Timeline Scroll Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref="timelineRef">
        <div v-if="isLoading" class="flex justify-center p-8">
          <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
        </div>
        
        <template v-else-if="ticket">
          <div v-for="item in timelineItems" :key="item.type + item.id" class="flex gap-4">
            
            <!-- History Event -->
            <template v-if="item.type === 'history'">
              <div class="w-10 flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center text-white/50 text-xs">
                  <ActivityIcon class="w-4 h-4" />
                </div>
              </div>
              <div class="flex-1 pt-1.5">
                <p class="text-sm text-df-text-muted">
                  <span class="font-medium text-df-text">{{ item.user?.firstname || 'System' }}</span>
                  changed <span class="font-medium">{{ formatField(item.field) }}</span> 
                  from <span class="line-through opacity-70">{{ formatValue(item.field, item.old_value) }}</span> 
                  to <span class="font-medium text-white">{{ formatValue(item.field, item.new_value) }}</span>
                </p>
                <span class="text-xs text-df-text-muted/50">{{ new Date(item.created_at).toLocaleString() }}</span>
              </div>
            </template>

            <!-- Article Event -->
            <template v-if="item.type === 'article'">
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
                <UserIcon class="w-5 h-5 text-df-text-muted" />
              </div>
              
              <!-- Message Bubble -->
              <div class="flex-1">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-sm font-medium text-df-text">
                    {{ item.authorName }}
                  </span>
                  <span class="text-xs text-df-text-muted">{{ new Date(item.created_at).toLocaleString() }}</span>
                  <span v-if="item.is_internal" class="ml-2 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                    <LockIcon class="w-3 h-3" /> Internal Note
                  </span>
                </div>
                <div :class="[
                  'border rounded-2xl rounded-tl-none p-4 text-sm whitespace-pre-wrap',
                  item.is_internal ? 'bg-orange-500/5 border-orange-500/20 text-orange-100/90' : 'bg-white/5 border-white/10 text-df-text-muted'
                ]">
                  {{ item.body }}
                </div>
              </div>
            </template>

          </div>
        </template>
        
        <div v-else class="flex flex-col items-center justify-center h-full text-center text-df-text-muted">
          <MessageSquareIcon class="w-12 h-12 mb-4 opacity-20" />
          <p>Conversation unavailable.</p>
        </div>
      </div>

      <!-- Reply Box -->
      <div class="p-4 border-t border-white/5 bg-df-bg/50">
        <form @submit.prevent="handleReply" class="relative">
          <textarea 
            v-model="replyText"
            rows="3"
            placeholder="Type your reply here..."
            class="w-full bg-df-bg/80 border border-white/10 rounded-xl py-3 px-4 pr-12 text-df-text placeholder-df-text-muted/30 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors resize-none"
            @keydown.enter.ctrl.exact="handleReply"
          ></textarea>
          
          <div class="absolute bottom-3 right-3 flex items-center gap-3">
            <label v-if="isAdminOrAgent" class="flex items-center gap-1.5 cursor-pointer text-xs text-df-text-muted hover:text-df-text transition-colors mr-2">
              <input type="checkbox" v-model="isInternalNote" class="rounded border-white/20 bg-white/5 text-df-primary focus:ring-df-primary focus:ring-offset-0" />
              <span>Internal Note</span>
            </label>
            <span class="text-xs text-df-text-muted hidden sm:inline-block">Ctrl + Enter</span>
            <button 
              type="submit" 
              :disabled="!replyText.trim() || isSubmitting"
              class="w-8 h-8 rounded-lg bg-df-primary hover:bg-df-primary-hover flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <SendIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 as Loader2Icon, MessageSquare as MessageSquareIcon, Send as SendIcon, User as UserIcon, Lock as LockIcon, Activity as ActivityIcon, X as XIcon } from 'lucide-vue-next'
import { ticketService } from '../services/ticketService'
import { iamService } from '../services/iamService'

const route = useRoute()
const router = useRouter()
const ticket = ref<any>(null)
const isLoading = ref(true)
const replyText = ref('')
const isSubmitting = ref(false)
const timelineRef = ref<HTMLElement | null>(null)
const isInternalNote = ref(false)
const isAdminOrAgent = ref(false)
const agents = ref<any[]>([])

const getInitials = (first = '', last = '') => {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U'
}

const getStatusName = (stateId: number) => {
  const map: Record<number, string> = { 1: 'New', 2: 'Open', 3: 'Pending', 4: 'Resolved', 5: 'Closed' }
  return map[stateId] || 'Unknown'
}

const formatField = (field: string) => {
  if (field === 'state_id') return 'Status';
  if (field === 'owner_id') return 'Assignee';
  return field;
}

const formatValue = (field: string, val: string) => {
  if (val === null || val === undefined || val === 'undefined') return 'Unassigned';
  if (field === 'state_id') return getStatusName(parseInt(val));
  if (field === 'owner_id') {
    const agent = agents.value.find(a => a.id === parseInt(val));
    return agent ? `${agent.firstname} ${agent.lastname}` : `User #${val}`;
  }
  return val;
}

const timelineItems = computed(() => {
  if (!ticket.value) return [];
  
  const items: any[] = [];
  
  if (ticket.value.articles) {
    ticket.value.articles.forEach((a: any) => {
      items.push({ ...a, type: 'article', authorName: ticket.value.customer?.firstname || 'Customer' });
    });
  }

  if (ticket.value.history) {
    ticket.value.history.forEach((h: any) => {
      items.push({ ...h, type: 'history' });
    });
  }

  // Sort by created_at ascending
  return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
})

const scrollToBottom = () => {
  if (timelineRef.value) {
    timelineRef.value.scrollTop = timelineRef.value.scrollHeight
  }
}

const fetchTicket = async () => {
  try {
    isLoading.value = true
    const id = parseInt(route.params.id as string)
    ticket.value = await ticketService.getTicketById(id)
    nextTick(() => scrollToBottom())
  } catch (error) {
    console.error("Failed to load ticket details", error)
  } finally {
    isLoading.value = false
  }
}

const fetchAgents = async () => {
  try {
    const allUsers = await iamService.getUsers()
    agents.value = allUsers.filter((u: any) => u.roles?.some((r: any) => r.name === 'admin' || r.name === 'agent'))
  } catch (error) {
    console.error("Failed to load agents", error)
  }
}

const updateState = async () => {
  try {
    await ticketService.changeState(ticket.value.id, ticket.value.state_id)
    await fetchTicket()
  } catch (error) {
    console.error("Failed to update state", error)
  }
}

const updateAssignee = async () => {
  try {
    await ticketService.assignTicket(ticket.value.id, ticket.value.owner_id)
    await fetchTicket()
  } catch (error) {
    console.error("Failed to update assignee", error)
  }
}

const handleReply = async () => {
  if (!replyText.value.trim() || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    await ticketService.addArticle(ticket.value.id, replyText.value, isInternalNote.value)
    replyText.value = ''
    isInternalNote.value = false
    // Refresh the ticket to get the new article
    await fetchTicket()
  } catch (error) {
    console.error("Failed to post reply", error)
    alert("Failed to send reply.")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.roles && (user.roles.includes('admin') || user.roles.includes('agent'))) {
        isAdminOrAgent.value = true
        fetchAgents() // Only fetch agents if current user has permissions
      }
    } catch(e) {}
  }

  fetchTicket()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
