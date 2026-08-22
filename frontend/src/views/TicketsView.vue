<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Todos os Chamados</h1>
        <p class="text-gray-500 text-sm mt-1">Gerencie e responda às solicitações de clientes</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-md"
      >
        <PlusIcon class="w-4 h-4" />
        Novo Chamado
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center p-12">
      <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
    </div>

    <!-- Tickets List (Table) -->
    <div v-else-if="tickets.length > 0" class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
            <th class="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
            <th class="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
            <th class="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            @click="router.push(`/tickets/${ticket.id}`)"
            class="border-b transition-colors cursor-pointer"
            :class="ticket.isEscalated ? 'border-red-200 bg-red-50 hover:bg-red-100' : 'border-gray-100 hover:bg-gray-50'"
          >
            <td class="py-4 px-6 text-sm" :class="ticket.isEscalated ? 'text-red-600' : 'text-gray-500'">#{{ ticket.id }}</td>
            <td class="py-4 px-6 text-sm font-medium" :class="ticket.isEscalated ? 'text-red-700' : 'text-gray-800'">
              {{ ticket.title }}
              <span v-if="ticket.isEscalated" class="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider">
                <AlertCircleIcon class="w-3 h-3" /> SLA
              </span>
            </td>
            <td class="py-4 px-6 text-sm">
              <span class="px-2.5 py-1 bg-blue-100 text-df-primary rounded-full text-xs font-medium">Aberto</span>
            </td>
            <td class="py-4 px-6 text-sm">
              <span v-if="ticket.isEscalated" class="text-red-500 font-bold flex items-center gap-1 text-xs">
                <AlertCircleIcon class="w-3 h-3" /> Violado
              </span>
              <span v-else-if="ticket.firstResponseEscalationAt" class="text-gray-500 flex items-center gap-1 text-xs whitespace-nowrap" :class="isNearBreach(ticket.firstResponseEscalationAt) ? 'text-orange-500 font-bold' : ''">
                <ClockIcon class="w-3 h-3" /> {{ formatTimeRemaining(ticket.firstResponseEscalationAt) }}
              </span>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
            <td class="py-4 px-6 text-sm" :class="ticket.isEscalated ? 'text-red-500' : 'text-gray-500'">{{ new Date(ticket.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center mt-10">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
        <InboxIcon class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-medium text-gray-800">Nenhum chamado encontrado</h3>
      <p class="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
        Sua fila está vazia no momento. Clique em "Novo Chamado" para criar o primeiro.
      </p>
    </div>

    <!-- Create Ticket Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white border border-gray-200 shadow-xl w-full max-w-lg rounded-2xl p-6 relative">
        <button @click="showCreateModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XIcon class="w-5 h-5" />
        </button>
        
        <h2 class="text-xl font-bold text-gray-800 mb-6">Criar Novo Chamado</h2>
        
        <form @submit.prevent="handleCreateTicket" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
            <input 
              v-model="newTicket.title" 
              type="text" 
              class="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              placeholder="Ex: Não consigo acessar minha conta"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
            <textarea 
              v-model="newTicket.initial_article_body" 
              rows="4"
              class="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors resize-none"
              placeholder="Descreva o problema em detalhes..."
              required
            ></textarea>
          </div>

          <!-- Dynamic Custom Fields -->
          <div v-for="field in customFields" :key="field.id">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ field.name }} <span v-if="field.is_required" class="text-red-500">*</span></label>
            
            <input 
              v-if="field.type === 'text' || field.type === 'number'"
              v-model="customFieldValues[field.id]" 
              :type="field.type" 
              class="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              :required="field.is_required"
            >
            
            <select
              v-else-if="field.type === 'select'"
              v-model="customFieldValues[field.id]" 
              class="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors"
              :required="field.is_required"
            >
              <option value="" disabled selected>Selecione uma opção...</option>
              <option v-for="opt in (field.options || '').split(',').map(s => s.trim()).filter(Boolean)" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 mt-8">
            <button 
              type="button" 
              @click="showCreateModal = false"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-[0.98] flex items-center gap-2"
              :disabled="isSubmitting"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Criando...' : 'Criar Chamado' }}</span>
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
import { Plus as PlusIcon, Inbox as InboxIcon, Loader2 as Loader2Icon, X as XIcon, AlertCircle as AlertCircleIcon, Clock as ClockIcon } from 'lucide-vue-next'
import { ticketService } from '../services/ticketService'
import { customFieldsService, type CustomField } from '../services/customFieldsService'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const router = useRouter()
const tickets = ref<any[]>([])
const isLoading = ref(true)
const showCreateModal = ref(false)
const isSubmitting = ref(false)

const newTicket = ref({
  title: '',
  initial_article_body: ''
})

const customFields = ref<CustomField[]>([])
const customFieldValues = ref<Record<number, string>>({})

const isNearBreach = (dateString: string) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
  return diffHours > 0 && diffHours <= 1 // Less than 1 hour remaining
}

const formatTimeRemaining = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Vencido'
  
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 60) {
    return `${diffMins}m`
  }
  
  const diffHours = Math.floor(diffMins / 60)
  const remainingMins = diffMins % 60
  
  if (diffHours < 24) {
    return `${diffHours}h ${remainingMins > 0 ? remainingMins + 'm' : ''}`
  }
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ${diffHours % 24}h`
}

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
    
    // Prepare custom fields array
    const fieldsToSubmit = Object.entries(customFieldValues.value)
      .filter(([id, value]) => value !== undefined && value !== '')
      .map(([id, value]) => ({
        field_id: Number(id),
        value: value as string
      }))

    await ticketService.createTicket({
      title: newTicket.value.title,
      initial_article_body: newTicket.value.initial_article_body,
      custom_fields: fieldsToSubmit
    })
    
    // Reset form and close modal
    newTicket.value = { title: '', initial_article_body: '' }
    customFieldValues.value = {}
    showCreateModal.value = false
    toastSuccess('Sucesso', 'Chamado criado com sucesso!')
    
    // Refresh list
    await fetchTickets()
  } catch (error) {
    console.error("Failed to create ticket", error)
    toastError('Erro', 'Não foi possível criar o chamado. Verifique a conexão com o servidor.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  fetchTickets()
  try {
    customFields.value = await customFieldsService.getCustomFields()
  } catch (error) {
    console.error("Failed to fetch custom fields", error)
  }
})
</script>
