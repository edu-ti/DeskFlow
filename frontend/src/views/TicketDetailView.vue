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
          <span class="px-2.5 py-1 bg-df-accent/20 text-df-accent rounded-full text-xs font-medium">Open</span>
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
            <label class="text-xs text-df-text-muted font-medium uppercase tracking-wider block mb-1">Created At</label>
            <p class="text-sm text-df-text">{{ new Date(ticket.created_at).toLocaleString() }}</p>
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
          <div v-for="article in ticket.articles" :key="article.id" class="flex gap-4">
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
              <UserIcon class="w-5 h-5 text-df-text-muted" />
            </div>
            
            <!-- Message Bubble -->
            <div class="flex-1">
              <div class="flex items-baseline gap-2 mb-1">
                <span class="text-sm font-medium text-df-text">
                  <!-- Hardcoding to Customer for now as we don't track article creator yet -->
                  {{ ticket.customer?.firstname || 'User' }}
                </span>
                <span class="text-xs text-df-text-muted">{{ new Date(article.created_at).toLocaleString() }}</span>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 text-sm text-df-text-muted whitespace-pre-wrap">
                {{ article.body }}
              </div>
            </div>
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
          
          <div class="absolute bottom-3 right-3 flex items-center gap-2">
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
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2 as Loader2Icon, MessageSquare as MessageSquareIcon, Send as SendIcon, User as UserIcon } from 'lucide-vue-next'
import { ticketService } from '../services/ticketService'

const route = useRoute()
const ticket = ref<any>(null)
const isLoading = ref(true)
const replyText = ref('')
const isSubmitting = ref(false)
const timelineRef = ref<HTMLElement | null>(null)

const getInitials = (first = '', last = '') => {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U'
}

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

const handleReply = async () => {
  if (!replyText.value.trim() || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    await ticketService.addArticle(ticket.value.id, replyText.value)
    replyText.value = ''
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
