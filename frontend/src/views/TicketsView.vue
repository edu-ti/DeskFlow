<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-df-text">All Tickets</h1>
        <p class="text-df-text-muted text-sm mt-1">Manage and respond to customer requests</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-df-primary/20"
      >
        <PlusIcon class="w-4 h-4" />
        New Ticket
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center p-12">
      <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
    </div>

    <!-- Tickets List (Table) -->
    <div v-else-if="tickets.length > 0" class="glass-panel rounded-xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/10 bg-white/5">
            <th class="py-4 px-6 text-xs font-semibold text-df-text-muted uppercase tracking-wider">ID</th>
            <th class="py-4 px-6 text-xs font-semibold text-df-text-muted uppercase tracking-wider">Title</th>
            <th class="py-4 px-6 text-xs font-semibold text-df-text-muted uppercase tracking-wider">Status</th>
            <th class="py-4 px-6 text-xs font-semibold text-df-text-muted uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            @click="router.push(`/tickets/${ticket.id}`)"
            class="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <td class="py-4 px-6 text-sm text-df-text-muted">#{{ ticket.id }}</td>
            <td class="py-4 px-6 text-sm font-medium text-df-text">{{ ticket.title }}</td>
            <td class="py-4 px-6 text-sm">
              <span class="px-2.5 py-1 bg-df-accent/20 text-df-accent rounded-full text-xs font-medium">Open</span>
            </td>
            <td class="py-4 px-6 text-sm text-df-text-muted">{{ new Date(ticket.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel rounded-xl p-12 text-center mt-10">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-df-text-muted mb-4">
        <InboxIcon class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-medium text-df-text">No tickets found</h3>
      <p class="text-sm text-df-text-muted mt-2 max-w-sm mx-auto">
        Your queue is empty right now. Click "New Ticket" to create your first one.
      </p>
    </div>

    <!-- Create Ticket Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-df-bg/80 backdrop-blur-sm">
      <div class="glass-panel w-full max-w-lg rounded-2xl p-6 relative">
        <button @click="showCreateModal = false" class="absolute top-4 right-4 text-df-text-muted hover:text-white">
          <XIcon class="w-5 h-5" />
        </button>
        
        <h2 class="text-xl font-bold text-df-text mb-6">Create New Ticket</h2>
        
        <form @submit.prevent="handleCreateTicket" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-2">Subject</label>
            <input 
              v-model="newTicket.title" 
              type="text" 
              class="w-full bg-df-bg/50 border border-white/10 rounded-lg py-2.5 px-4 text-df-text placeholder-df-text-muted/30 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="E.g. Cannot access my account"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-2">Message</label>
            <textarea 
              v-model="newTicket.initial_article_body" 
              rows="4"
              class="w-full bg-df-bg/50 border border-white/10 rounded-lg py-2.5 px-4 text-df-text placeholder-df-text-muted/30 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors resize-none"
              placeholder="Describe the issue in detail..."
              required
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 mt-8">
            <button 
              type="button" 
              @click="showCreateModal = false"
              class="px-4 py-2 rounded-lg text-sm font-medium text-df-text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-[0.98] flex items-center gap-2"
              :disabled="isSubmitting"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Creating...' : 'Create Ticket' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus as PlusIcon, Inbox as InboxIcon, Loader2 as Loader2Icon, X as XIcon } from 'lucide-vue-next'
import { ticketService } from '../services/ticketService'

const router = useRouter()
const tickets = ref<any[]>([])
const isLoading = ref(true)
const showCreateModal = ref(false)
const isSubmitting = ref(false)

const newTicket = ref({
  title: '',
  initial_article_body: ''
})

const fetchTickets = async () => {
  try {
    isLoading.value = true
    tickets.value = await ticketService.getTickets()
  } catch (error) {
    console.error("Failed to load tickets", error)
  } finally {
    isLoading.value = false
  }
}

const handleCreateTicket = async () => {
  try {
    isSubmitting.value = true
    await ticketService.createTicket({
      title: newTicket.value.title,
      initial_article_body: newTicket.value.initial_article_body
    })
    
    // Reset form and close modal
    newTicket.value = { title: '', initial_article_body: '' }
    showCreateModal.value = false
    
    // Refresh list
    await fetchTickets()
  } catch (error) {
    console.error("Failed to create ticket", error)
    alert("Could not create ticket. Check backend connection.")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchTickets()
})
</script>
