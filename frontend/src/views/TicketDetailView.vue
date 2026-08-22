<template>
  <div class="max-w-7xl mx-auto lg:h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 pb-6 lg:pb-0">
    <!-- Left Column: Ticket Info & SLA Dashboard -->
    <div class="w-full lg:w-1/3 flex flex-col gap-5 lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar shrink-0">
      <div v-if="isLoading" class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl flex justify-center">
        <Loader2Icon class="w-6 h-6 text-df-primary animate-spin" />
      </div>
      
      <div v-else-if="ticket" class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl space-y-5">
        <!-- Header Status & Service Type -->
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <span class="text-xs font-mono font-bold text-gray-400">TICKET</span>
            <h1 class="text-xl font-extrabold text-gray-900">#{{ ticket.id }}</h1>
          </div>
          
          <div class="flex items-center gap-2">
            <select 
              v-if="isAdminOrAgent" 
              v-model="ticket.state_id" 
              @change="updateState"
              class="px-3 py-1.5 bg-blue-50 text-df-primary border border-blue-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-df-primary/20 appearance-none cursor-pointer"
            >
              <option :value="1">Novo</option>
              <option :value="2">Aberto</option>
              <option :value="3">Pendente</option>
              <option :value="4">Resolvido</option>
              <option :value="5">Fechado</option>
            </select>
            <span v-else class="px-3 py-1.5 bg-blue-50 text-df-primary border border-blue-200 rounded-xl text-xs font-bold">
              {{ getStatusName(ticket.state_id) }}
            </span>
          </div>
        </div>
        
        <h2 class="text-base text-gray-900 font-bold leading-snug">{{ ticket.title }}</h2>

        <!-- Modalidade de Atendimento: Remoto vs Presencial -->
        <div class="p-3 bg-gray-50 border border-gray-200/80 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Modalidade do Atendimento</label>
            <span :class="ticket.service_type === 'onsite' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'" class="px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider">
              {{ ticket.service_type === 'onsite' ? 'Presencial' : 'Remoto' }}
            </span>
          </div>
          
          <div v-if="isAdminOrAgent" class="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              @click="setServiceType('remote')" 
              :class="ticket.service_type !== 'onsite' ? 'bg-white text-df-primary font-bold shadow-xs border-df-primary/40' : 'bg-transparent text-gray-500 hover:bg-gray-100 border-transparent'"
              class="py-1.5 px-3 text-xs rounded-lg border transition-all flex items-center justify-center gap-1.5"
            >
              <MonitorIcon class="w-3.5 h-3.5" />
              <span>Remoto (4h)</span>
            </button>
            <button 
              type="button" 
              @click="setServiceType('onsite')" 
              :class="ticket.service_type === 'onsite' ? 'bg-white text-amber-700 font-bold shadow-xs border-amber-300' : 'bg-transparent text-gray-500 hover:bg-gray-100 border-transparent'"
              class="py-1.5 px-3 text-xs rounded-lg border transition-all flex items-center justify-center gap-1.5"
            >
              <MapPinIcon class="w-3.5 h-3.5" />
              <span>Presencial (8h)</span>
            </button>
          </div>
        </div>

        <div class="space-y-4 text-sm">
          <!-- Cliente & Empresa -->
          <div>
            <label class="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Cliente & Empresa</label>
            <div class="flex items-start gap-3 p-3 bg-gray-50/60 rounded-xl border border-gray-200/60">
              <div class="w-9 h-9 rounded-xl bg-df-primary/15 flex items-center justify-center text-df-primary font-bold text-sm shrink-0">
                {{ getInitials(ticket.customer?.firstname, ticket.customer?.lastname) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 font-bold truncate">{{ ticket.customer?.firstname }} {{ ticket.customer?.lastname }}</p>
                <p class="text-xs text-gray-500 truncate">{{ ticket.customer?.email }}</p>
                <div v-if="ticket.customer?.organization" class="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-gray-700 truncate flex items-center gap-1">
                    <Building2Icon class="w-3.5 h-3.5 text-gray-400" />
                    {{ ticket.customer.organization.name }}
                  </span>
                  <span v-if="ticket.customer.organization.calendar_type === 'extended_8_21'" class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                    SLA 8h-21h
                  </span>
                  <span v-else class="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    SLA 8h-18h
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Responsável -->
          <div>
            <label class="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Responsável / Técnico</label>
            <select 
              v-if="isAdminOrAgent" 
              v-model="ticket.owner_id" 
              @change="updateAssignee"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-df-primary focus:ring-2 focus:ring-df-primary/20"
            >
              <option :value="null">Não Atribuído</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.firstname }} {{ agent.lastname }}
              </option>
            </select>
            <div v-else class="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div v-if="ticket.owner" class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-df-primary/20 flex items-center justify-center text-df-primary font-bold text-xs">
                  {{ getInitials(ticket.owner?.firstname, ticket.owner?.lastname) }}
                </div>
                <p class="text-sm text-gray-800 font-medium">{{ ticket.owner?.firstname }} {{ ticket.owner?.lastname }}</p>
              </div>
              <p v-else class="text-sm text-gray-500">Não Atribuído</p>
            </div>
          </div>

          <!-- Painel de SLA em Horas Úteis -->
          <div class="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100/80 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                <ClockIcon class="w-4 h-4 text-df-primary" />
                <span>Prazos de SLA (Horas Úteis)</span>
              </div>
            </div>

            <div class="space-y-2.5">
              <!-- 1ª Resposta -->
              <div v-if="ticket.firstResponseEscalationAt" class="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-gray-700">1º Atendimento Inicial</span>
                  <span 
                    class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
                    :class="ticket.state_id === 1 && ticket.isEscalated ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-100'"
                  >
                    <span v-if="ticket.state_id === 1 && ticket.isEscalated">Violado</span>
                    <span v-else>{{ formatTimeRemaining(ticket.firstResponseEscalationAt) }}</span>
                  </span>
                </div>
                <div class="text-[11px] text-gray-400">
                  Alvo: {{ new Date(ticket.firstResponseEscalationAt).toLocaleString('pt-BR') }}
                </div>
              </div>

              <!-- Resolução Remota -->
              <div v-if="ticket.solutionEscalationAt" class="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-gray-700">Resolução Remota (4h)</span>
                  <span 
                    class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
                    :class="ticket.isEscalated ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-purple-50 text-purple-700 border border-purple-100'"
                  >
                    <span v-if="ticket.isEscalated">Violado</span>
                    <span v-else>{{ formatTimeRemaining(ticket.solutionEscalationAt) }}</span>
                  </span>
                </div>
                <div class="text-[11px] text-gray-400">
                  Alvo: {{ new Date(ticket.solutionEscalationAt).toLocaleString('pt-BR') }}
                </div>
              </div>

              <!-- Resolução Presencial -->
              <div v-if="ticket.onsiteResolutionEscalationAt || ticket.service_type === 'onsite'" class="p-2.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-amber-900 flex items-center gap-1">
                    <MapPinIcon class="w-3.5 h-3.5 text-amber-600" />
                    Atendimento Presencial (8h)
                  </span>
                  <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {{ formatTimeRemaining(ticket.onsiteResolutionEscalationAt) }}
                  </span>
                </div>
                <div class="text-[11px] text-gray-400">
                  Alvo: {{ ticket.onsiteResolutionEscalationAt ? new Date(ticket.onsiteResolutionEscalationAt).toLocaleString('pt-BR') : 'A calcular' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Campos Customizados -->
          <div v-if="ticket.custom_field_values && ticket.custom_field_values.length > 0" class="pt-2 border-t border-gray-100">
            <h3 class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Detalhes Adicionais</h3>
            <div class="space-y-2">
              <div v-for="cfValue in ticket.custom_field_values" :key="cfValue.id" class="text-xs">
                <span class="text-gray-500 block">{{ cfValue.custom_field?.name }}:</span>
                <span class="font-medium text-gray-800">{{ cfValue.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
          <XIcon class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-medium text-gray-800">Chamado Não Encontrado</h3>
        <p class="text-sm text-gray-500 mt-2">Este chamado pode ter sido excluído ou não existe.</p>
        <button @click="router.push('/tickets')" class="mt-6 text-df-primary hover:text-df-primary-hover text-sm font-medium">
          &larr; Voltar para Chamados
        </button>
      </div>

      <div class="flex-1"></div>
    </div>

    <!-- Right Column: Articles Timeline -->
    <div class="w-full lg:w-2/3 flex flex-col flex-1 h-[600px] lg:h-full bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 class="text-gray-800 font-medium flex items-center gap-2">
          <MessageSquareIcon class="w-5 h-5 text-df-primary" />
          Conversa & Histórico
        </h3>
        
        <div v-if="isAdminOrAgent && macros.length > 0" class="relative">
          <button @click="showMacroDropdown = !showMacroDropdown" class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 px-3 rounded-md flex items-center gap-2 transition-colors">
            <PlayIcon class="w-3 h-3" />
            Aplicar Macro
            <ChevronDownIcon class="w-3 h-3 ml-1" />
          </button>
          
          <div v-if="showMacroDropdown" class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
            <button 
              v-for="macro in macros" 
              :key="macro.id"
              @click="applyMacro(macro.id)"
              class="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
              :title="macro.name"
            >
              {{ macro.name }}
            </button>
          </div>
          <!-- Click outside overlay -->
          <div v-if="showMacroDropdown" @click="showMacroDropdown = false" class="fixed inset-0 z-0"></div>
        </div>
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
                <div class="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                  <ActivityIcon class="w-4 h-4" />
                </div>
              </div>
              <div class="flex-1 pt-1.5">
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-800">{{ item.user?.firstname || 'Sistema' }}</span>
                  alterou <span class="font-medium">{{ formatField(item.field) }}</span> 
                  de <span class="line-through opacity-70">{{ formatValue(item.field, item.old_value) }}</span> 
                  para <span class="font-medium text-gray-800">{{ formatValue(item.field, item.new_value) }}</span>
                </p>
                <span class="text-xs text-gray-400">{{ new Date(item.created_at).toLocaleString() }}</span>
              </div>
            </template>

            <!-- Article Event -->
            <template v-if="item.type === 'article'">
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-500 text-sm font-medium">
                <UserIcon class="w-5 h-5 text-gray-400" />
              </div>
              
              <!-- Message Bubble -->
              <div class="flex-1">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-sm font-medium text-gray-800">
                    {{ item.authorName }}
                  </span>
                  <span class="text-xs text-gray-500">{{ new Date(item.created_at).toLocaleString() }}</span>
                  <span v-if="item.is_internal" class="ml-2 text-[10px] font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                    <LockIcon class="w-3 h-3" /> Nota Interna
                  </span>
                </div>
                <div :class="[
                  'border rounded-2xl rounded-tl-none p-4 text-sm whitespace-pre-wrap',
                  item.is_internal ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                ]">
                  {{ item.body }}
                </div>
              </div>
            </template>

          </div>
        </template>
        
        <div v-else class="flex flex-col items-center justify-center h-full text-center text-gray-400">
          <MessageSquareIcon class="w-12 h-12 mb-4 opacity-30" />
          <p>Conversa indisponível.</p>
        </div>
      </div>

      <!-- AI Assistant Summary Box (if generated) -->
      <div v-if="aiSummary" class="mx-4 mt-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl shadow-xs animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 text-purple-900 font-bold text-xs">
            <SparklesIcon class="w-4 h-4 text-purple-600" />
            <span>Resumo Executivo da IA</span>
          </div>
          <button @click="aiSummary = ''" class="text-purple-400 hover:text-purple-700 p-1 rounded-lg">
            <XIcon class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="text-xs text-purple-950 leading-relaxed whitespace-pre-wrap">
          {{ aiSummary }}
        </div>
      </div>

      <!-- Reply Box Toolbar with AI Buttons -->
      <div class="px-4 pt-3 pb-1 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button 
            @click="generateAiSummary" 
            type="button" 
            :disabled="isGeneratingSummary"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Loader2Icon v-if="isGeneratingSummary" class="w-3 h-3 animate-spin text-purple-600" />
            <SparklesIcon v-else class="w-3 h-3 text-purple-600" />
            <span>Resumir com IA</span>
          </button>

          <button 
            @click="generateAiSuggestion" 
            type="button" 
            :disabled="isGeneratingSuggestion"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Loader2Icon v-if="isGeneratingSuggestion" class="w-3 h-3 animate-spin text-blue-600" />
            <SparklesIcon v-else class="w-3 h-3 text-blue-600" />
            <span>Sugerir Resposta IA</span>
          </button>
        </div>
      </div>

      <!-- Reply Box -->
      <div class="p-4 pt-2 bg-gray-50">
        <form @submit.prevent="handleReply" class="relative">
          <textarea 
            v-model="replyText"
            rows="3"
            placeholder="Digite sua resposta aqui..."
            class="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 pr-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary transition-colors resize-none"
            @keydown.enter.ctrl.exact="handleReply"
          ></textarea>
          
          <div class="absolute bottom-3 right-3 flex items-center gap-3">
            <label v-if="isAdminOrAgent" class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 hover:text-gray-800 transition-colors mr-2">
              <input type="checkbox" v-model="isInternalNote" class="rounded border-gray-300 bg-white text-df-primary focus:ring-df-primary focus:ring-offset-0" />
              <span>Nota Interna</span>
            </label>
            <span class="text-xs text-gray-400 hidden sm:inline-block">Ctrl + Enter</span>
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
import { 
  Loader2 as Loader2Icon, 
  MessageSquare as MessageSquareIcon, 
  Send as SendIcon, 
  User as UserIcon, 
  Lock as LockIcon, 
  Activity as ActivityIcon, 
  X as XIcon, 
  Play as PlayIcon, 
  ChevronDown as ChevronDownIcon, 
  Clock as ClockIcon, 
  AlertCircle as AlertCircleIcon, 
  Sparkles as SparklesIcon,
  Building2 as Building2Icon,
  Monitor as MonitorIcon,
  MapPin as MapPinIcon
} from 'lucide-vue-next'
import { ticketService } from '../services/ticketService'
import { iamService } from '../services/iamService'
import api from '../services/api'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

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
const macros = ref<any[]>([])
const showMacroDropdown = ref(false)
const aiSummary = ref('')
const isGeneratingSummary = ref(false)
const isGeneratingSuggestion = ref(false)

const generateAiSummary = async () => {
  if (!ticket.value) return
  isGeneratingSummary.value = true
  try {
    const res = await api.post(`/ai/tickets/${ticket.value.id}/summarize`)
    aiSummary.value = res.data.summary
  } catch (error) {
    console.error('Failed to generate AI summary', error)
    toastError('Erro', 'Não foi possível gerar o resumo com IA.')
  } finally {
    isGeneratingSummary.value = false
  }
}

const generateAiSuggestion = async () => {
  if (!ticket.value) return
  isGeneratingSuggestion.value = true
  try {
    const res = await api.post(`/ai/tickets/${ticket.value.id}/suggest-reply`)
    replyText.value = res.data.suggestion
  } catch (error) {
    console.error('Failed to generate AI suggestion', error)
    toastError('Erro', 'Não foi possível sugerir resposta com IA.')
  } finally {
    isGeneratingSuggestion.value = false
  }
}

const getInitials = (first = '', last = '') => {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U'
}

const getStatusName = (stateId: number) => {
  const map: Record<number, string> = { 1: 'Novo', 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado' }
  return map[stateId] || 'Desconhecido'
}

const formatField = (field: string) => {
  if (field === 'state_id') return 'Status';
  if (field === 'owner_id') return 'Responsável';
  if (field === 'service_type') return 'Modalidade';
  if (field === 'priority_id') return 'Prioridade';
  return field;
}

const formatValue = (field: string, val: string) => {
  if (val === null || val === undefined || val === 'undefined') return 'Não Atribuído';
  if (field === 'state_id') return getStatusName(parseInt(val));
  if (field === 'service_type') return val === 'onsite' ? 'Presencial' : 'Remoto';
  if (field === 'owner_id') {
    const agent = agents.value.find(a => a.id === parseInt(val));
    return agent ? `${agent.firstname} ${agent.lastname}` : `Usuário #${val}`;
  }
  return val;
}

const timelineItems = computed(() => {
  if (!ticket.value) return [];
  
  const items: any[] = [];
  
  if (ticket.value.articles) {
    ticket.value.articles.forEach((a: any) => {
      items.push({ ...a, type: 'article', authorName: ticket.value.customer?.firstname || 'Cliente' });
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

const formatTimeRemaining = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Prazo Excedido'
  
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 60) {
    return `${diffMins}m restantes`
  }
  
  const diffHours = Math.floor(diffMins / 60)
  const remainingMins = diffMins % 60
  
  if (diffHours < 24) {
    return `${diffHours}h ${remainingMins > 0 ? remainingMins + 'm' : ''} restantes`
  }
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ${diffHours % 24}h restantes`
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
    toastSuccess('Sucesso', 'Status atualizado com sucesso.')
    await fetchTicket()
  } catch (error) {
    console.error("Failed to update state", error)
    toastError('Erro', 'Falha ao atualizar status.')
  }
}

const setServiceType = async (serviceType: 'remote' | 'onsite') => {
  try {
    await ticketService.changeServiceType(ticket.value.id, serviceType)
    toastSuccess('Sucesso', `Modalidade alterada para ${serviceType === 'onsite' ? 'Presencial (8h SLA)' : 'Remoto (4h SLA)'}`)
    await fetchTicket()
  } catch (error) {
    console.error("Failed to update service type", error)
    toastError('Erro', 'Falha ao atualizar modalidade de atendimento.')
  }
}

const updateAssignee = async () => {
  try {
    await ticketService.assignTicket(ticket.value.id, ticket.value.owner_id)
    toastSuccess('Sucesso', 'Responsável atualizado.')
    await fetchTicket()
  } catch (error) {
    console.error("Failed to update assignee", error)
    toastError('Erro', 'Falha ao atualizar responsável.')
  }
}

const handleReply = async () => {
  if (!replyText.value.trim() || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    await ticketService.addArticle(ticket.value.id, replyText.value, isInternalNote.value)
    replyText.value = ''
    isInternalNote.value = false
    await fetchTicket()
  } catch (error) {
    console.error("Failed to post reply", error)
    toastError('Erro', 'Falha ao enviar resposta.')
  } finally {
    isSubmitting.value = false
  }
}

const fetchMacros = async () => {
  try {
    const res = await api.get('/macros')
    macros.value = res.data
  } catch (error) {
    console.error("Failed to load macros", error)
  }
}

const applyMacro = async (macroId: number) => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  showMacroDropdown.value = false
  
  try {
    await api.post(`/tickets/${ticket.value.id}/macros/${macroId}/apply`)
    toastSuccess('Sucesso', 'Macro aplicada com sucesso.')
    await fetchTicket()
  } catch (error) {
    console.error("Failed to apply macro", error)
    toastError('Erro', 'Falha ao aplicar macro.')
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
        fetchAgents()
        fetchMacros()
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
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
