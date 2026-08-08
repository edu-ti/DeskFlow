<template>
  <div class="flex h-[calc(100vh-4rem)] -mx-8 -my-8 overflow-hidden bg-white">
    <!-- Left Panel: Chat List -->
    <div class="w-1/2 max-w-[700px] min-w-[550px] flex-shrink-0 border-r border-gray-200 flex flex-col h-full bg-gray-50">
      <!-- Tabs -->
      <div class="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">WhatsApp (Omnichannel)</h2>
        <div class="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors"
            :class="activeTab === tab.id ? 'bg-df-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ tab.label }}
            <span v-if="getTicketCount(tab.id) > 0" 
                  class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                  :class="activeTab === tab.id ? 'bg-white/20' : 'bg-gray-300 text-gray-700'">
              {{ getTicketCount(tab.id) }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Search -->
      <div class="p-3 bg-white border-b border-gray-200">
        <div class="relative">
          <SearchIcon class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Pesquisar conversas..." 
            class="w-full pl-9 pr-3 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:border-df-primary focus:ring-1 focus:ring-df-primary outline-none"
          >
        </div>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="isLoadingTickets" class="flex justify-center p-8">
          <Loader2Icon class="w-6 h-6 text-df-primary animate-spin" />
        </div>
        <div v-else-if="filteredTickets.length === 0" class="flex flex-col items-center justify-center p-8 text-gray-400">
          <MessageCircleIcon class="w-12 h-12 mb-3 text-gray-300" />
          <p class="text-sm text-center">Nenhuma conversa encontrada nesta aba.</p>
        </div>
        <div v-else>
          <div 
            v-for="ticket in filteredTickets" 
            :key="ticket.id"
            @click="selectTicket(ticket)"
            class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
            :class="selectedTicket?.id === ticket.id ? 'bg-blue-50 hover:bg-blue-50' : 'bg-white'"
          >
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-medium text-gray-900 truncate flex-1">
                {{ ticket.customer ? `${ticket.customer.firstname} ${ticket.customer.lastname}` : 'Cliente' }}
              </h3>
              <span class="text-xs text-gray-500 whitespace-nowrap ml-2">
                {{ formatTime(ticket.updated_at) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-500 truncate flex-1">
                {{ ticket.title }}
              </p>
              <span v-if="ticket.unread" class="w-2.5 h-2.5 bg-green-500 rounded-full ml-2"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Active Chat -->
    <div class="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0">
      <div v-if="!selectedTicket" class="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" class="w-24 h-24 mb-6 opacity-20 grayscale" alt="WhatsApp" />
        <h2 class="text-xl font-medium text-gray-600 mb-2">DeskFlow Omnichannel</h2>
        <p class="text-sm">Selecione uma conversa na lista à esquerda para começar.</p>
      </div>
      
      <template v-else>
        <!-- Chat Header -->
        <div class="h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-green-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
              {{ (selectedTicket.customer?.firstname || 'C')[0].toUpperCase() }}
            </div>
            <div>
              <h2 class="font-medium text-gray-900">
                {{ selectedTicket.customer ? `${selectedTicket.customer.firstname} ${selectedTicket.customer.lastname}` : 'Cliente' }}
              </h2>
              <p class="text-xs text-green-600 font-medium">WhatsApp</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <select v-model="selectedTicket.state_id" @change="updateTicketState(selectedTicket.state_id)" class="text-sm border-gray-300 rounded-md focus:ring-df-primary focus:border-df-primary bg-white h-9">
              <option :value="1">Triagem</option>
              <option :value="2">Aberto</option>
              <option :value="3">Em Atendimento</option>
              <option :value="4">Pendente</option>
              <option :value="6">Dúvida</option>
              <option :value="5">Resolvido</option>
            </select>
            
            <button class="flex items-center px-3 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors">
              <ZapIcon class="w-4 h-4 mr-1.5" />
              Ações
            </button>

            <button @click="toggleInfoSidebar" class="flex items-center px-3 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors" title="Informações do Chamado">
              <InfoIcon class="w-4 h-4 mr-1.5" />
              Info
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="messagesContainer">
          <div v-if="isLoadingMessages" class="flex justify-center p-4">
            <Loader2Icon class="w-6 h-6 text-gray-500 animate-spin" />
          </div>
          <template v-else>
            <div 
              v-for="msg in messages" 
              :key="msg.id"
              class="flex flex-col"
              :class="msg.isInternal || msg.senderType === 'agent' ? 'items-end' : 'items-start'"
            >
              <div 
                class="max-w-[75%] rounded-lg p-3 shadow-sm relative"
                :class="{
                  'bg-[#d9fdd3] text-gray-800 rounded-tr-none': (msg.isInternal || msg.senderType === 'agent') && !msg.isSystem,
                  'bg-white text-gray-800 rounded-tl-none': !msg.isInternal && msg.senderType !== 'agent' && !msg.isSystem,
                  'bg-yellow-100 text-yellow-800 text-xs mx-auto text-center !max-w-full': msg.isSystem
                }"
              >
                <!-- System Message -->
                <template v-if="msg.isSystem">
                  {{ msg.body }}
                </template>
                
                <!-- Normal Message -->
                <template v-else>
                  <p class="whitespace-pre-wrap text-sm leading-relaxed" v-html="formatMessage(msg.body)"></p>
                  <div class="flex items-center justify-end mt-1 space-x-1">
                    <span class="text-[10px] text-gray-500">{{ formatTime(msg.created_at) }}</span>
                    <!-- Fake read receipt for agent messages -->
                    <CheckCheckIcon v-if="msg.isInternal || msg.senderType === 'agent'" class="w-3 h-3 text-blue-500" />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Chat Input -->
        <div class="p-4 bg-gray-50 border-t border-gray-200">
          <div class="flex items-end bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-df-primary focus-within:border-transparent transition-all">
            <textarea 
              v-model="newMessage"
              @keydown.enter.prevent="sendMessage"
              placeholder="Digite uma mensagem..." 
              class="flex-1 max-h-32 p-3 bg-transparent border-none outline-none resize-none text-sm placeholder-gray-400"
              rows="1"
              @input="adjustTextareaHeight"
              ref="textareaRef"
            ></textarea>
            <button 
              @click="sendMessage"
              :disabled="!newMessage.trim() || isSending"
              class="p-3 text-df-primary hover:text-df-primary-hover disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <SendIcon class="w-5 h-5" v-if="!isSending" />
              <Loader2Icon class="w-5 h-5 animate-spin" v-else />
            </button>
          </div>
          <p class="text-[10px] text-gray-400 mt-2 text-center">Pressione Enter para enviar. Shift + Enter para quebrar linha.</p>
        </div>
      </template>
    </div>

    <!-- Right Panel: Ticket Info Sidebar (Collapsible) -->
    <div v-if="showInfoSidebar && selectedTicket" class="w-[350px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg relative z-20">
      <div class="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 class="font-semibold text-gray-800">Informações do Chamado</h3>
        <button @click="toggleInfoSidebar" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-5 overflow-y-auto flex-1">
        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Cliente</p>
          <p class="text-gray-900 font-medium">
            {{ selectedTicket.customer ? `${selectedTicket.customer.firstname} ${selectedTicket.customer.lastname}` : 'Cliente' }}
          </p>
          <p class="text-sm text-gray-500 mt-1">Via WhatsApp</p>
        </div>

        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Assunto / Resumo</p>
          <p class="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
            {{ selectedTicket.title || 'Sem assunto' }}
          </p>
        </div>

        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status Atual</p>
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
            {{ tabs.find(t => t.id === selectedTicket.state_id)?.label || 'Desconhecido' }}
          </span>
        </div>
        
        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Criado em</p>
          <p class="text-sm text-gray-800">
            {{ new Date(selectedTicket.created_at).toLocaleString('pt-BR') }}
          </p>
        </div>
        
        <!-- Action to open full ticket -->
        <button @click="goToTicketDetail" class="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <ExternalLinkIcon class="w-4 h-4 mr-2 text-gray-400" />
          Abrir chamado completo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search as SearchIcon, MessageCircle as MessageCircleIcon, Send as SendIcon, Loader2 as Loader2Icon, ExternalLink as ExternalLinkIcon, CheckCheck as CheckCheckIcon, Zap as ZapIcon, Info as InfoIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { socketService } from '@/services/socketService'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success: toastSuccess, error: toastError } = useToast()

const tabs = [
  { id: 1, label: 'Triagem' },
  { id: 2, label: 'Aberto' },
  { id: 3, label: 'Em Atendimento' },
  { id: 4, label: 'Pendente' },
  { id: 6, label: 'Dúvida' },
  { id: 5, label: 'Resolvido' },
]

const activeTab = ref(2) // Default Aberto
const searchQuery = ref('')
const tickets = ref<any[]>([])
const isLoadingTickets = ref(true)
const selectedTicket = ref<any>(null)
const messages = ref<any[]>([])
const isLoadingMessages = ref(false)
const newMessage = ref('')
const isSending = ref(false)
const showInfoSidebar = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Current logged user
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

const fetchTickets = async () => {
  isLoadingTickets.value = true
  try {
    const response = await api.get('/tickets')
    // Filter only whatsapp tickets
    tickets.value = response.data.filter((t: any) => t.source === 'whatsapp')
  } catch (err) {
    toastError('Erro', 'Não foi possível carregar as conversas.')
  } finally {
    isLoadingTickets.value = false
  }
}

const filteredTickets = computed(() => {
  let filtered = tickets.value.filter(t => t.state_id === activeTab.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.title?.toLowerCase().includes(q) || 
      (t.customer?.firstname + ' ' + t.customer?.lastname).toLowerCase().includes(q)
    )
  }
  return filtered
})

const getTicketCount = (stateId: number) => {
  return tickets.value.filter(t => t.state_id === stateId).length
}

const selectTicket = async (ticket: any) => {
  selectedTicket.value = ticket
  ticket.unread = false // mark as read locally
  await loadMessages(ticket.id)
}

const loadMessages = async (ticketId: number) => {
  isLoadingMessages.value = true
  try {
    const res = await api.get(`/tickets/${ticketId}`)
    const fullTicket = res.data
    // Map articles to chat messages
    messages.value = fullTicket.articles.map((art: any) => {
      // Determine if sender is agent or customer based on who created it
      // For MVP, we assume if it's created by ticket customer, it's incoming.
      const isAgent = art.created_by?.roles?.includes('admin') || art.created_by?.roles?.includes('agent')
      return {
        id: art.id,
        body: art.body,
        created_at: art.created_at,
        isInternal: art.is_internal,
        senderType: isAgent ? 'agent' : 'customer',
        isSystem: art.type === 'system'
      }
    })
    scrollToBottom()
  } catch (err) {
    toastError('Erro', 'Não foi possível carregar as mensagens.')
  } finally {
    isLoadingMessages.value = false
  }
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatMessage = (text: string) => {
  if (!text) return ''
  // Basic markdown to HTML conversion for bold, italic, line breaks
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
}

const adjustTextareaHeight = () => {
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedTicket.value) return
  
  isSending.value = true
  try {
    const res = await api.post(`/tickets/${selectedTicket.value.id}/articles`, {
      body: newMessage.value.trim(),
      type: 'note',
      is_internal: false
    })
    
    // Add to local list optimistically
    messages.value.push({
      id: res.data.id,
      body: newMessage.value.trim(),
      created_at: new Date().toISOString(),
      isInternal: false,
      senderType: 'agent',
      isSystem: false
    })
    
    newMessage.value = ''
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
    scrollToBottom()
    
    // Move ticket to top of list and update its updated_at
    selectedTicket.value.updated_at = new Date().toISOString()
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value.id)
    if (tIndex > -1) {
      const t = tickets.value.splice(tIndex, 1)[0]
      tickets.value.unshift(t)
    }
    
  } catch (err) {
    toastError('Erro', 'Falha ao enviar mensagem.')
  } finally {
    isSending.value = false
  }
}

const updateTicketState = async (newStateId: number) => {
  if (!selectedTicket.value) return
  try {
    await api.patch(`/tickets/${selectedTicket.value.id}/state`, { state_id: newStateId })
    toastSuccess('Sucesso', 'Status atualizado com sucesso.')
    
    // Locally update ticket state
    const t = tickets.value.find(t => t.id === selectedTicket.value.id)
    if (t) t.state_id = newStateId
    
    // Deselect if it moved out of current tab
    if (newStateId !== activeTab.value) {
      selectedTicket.value = null
    }
  } catch (err) {
    toastError('Erro', 'Falha ao atualizar status.')
  }
}

const toggleInfoSidebar = () => {
  showInfoSidebar.value = !showInfoSidebar.value
}

const goToTicketDetail = () => {
  if (selectedTicket.value) {
    router.push(`/tickets/${selectedTicket.value.id}`)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Socket listening for new messages
const handleSocketMessage = (data: any) => {
  if (data.ticket.source !== 'whatsapp') return
  
  // se for do ticket selecionado, atualiza o chat
  if (selectedTicket.value && data.ticket.id === selectedTicket.value.id) {
    // Add new article to messages list if it's not from us
    if (data.article && data.article.created_by?.id !== currentUser.id) {
      const isAgent = data.article.created_by?.roles?.includes('admin') || data.article.created_by?.roles?.includes('agent')
      messages.value.push({
        id: data.article.id,
        body: data.article.body,
        created_at: data.article.created_at,
        isInternal: data.article.is_internal,
        senderType: isAgent ? 'agent' : 'customer',
        isSystem: data.article.type === 'system'
      })
      scrollToBottom()
    }
  }
  
  // Atualiza a lista na esquerda
  let existingTicket = tickets.value.find(t => t.id === data.ticket.id)
  if (existingTicket) {
    existingTicket.updated_at = new Date().toISOString()
    // Marca unread se não estivermos com ele aberto e a mensagem não for do agent
    if (!selectedTicket.value || selectedTicket.value.id !== existingTicket.id) {
       if (data.article && !data.article.created_by?.roles?.includes('admin')) {
         existingTicket.unread = true
       }
    }
    // Mover para o topo
    const tIndex = tickets.value.findIndex(t => t.id === data.ticket.id)
    if (tIndex > -1) {
      const t = tickets.value.splice(tIndex, 1)[0]
      tickets.value.unshift(t)
    }
  } else {
    // É um novo ticket, faz fetch de novo pra garantir
    fetchTickets()
  }
}

onMounted(() => {
  fetchTickets()
  
  const socket = socketService.getSocket()
  if (socket) {
    socket.on('ticket.updated', handleSocketMessage)
  }
})

onUnmounted(() => {
  const socket = socketService.getSocket()
  if (socket) {
    socket.off('ticket.updated', handleSocketMessage)
  }
})

// Focus textarea when a ticket is selected
watch(selectedTicket, (newVal) => {
  if (newVal) {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})
</script>
