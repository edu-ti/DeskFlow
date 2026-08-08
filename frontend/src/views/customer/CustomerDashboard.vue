<template>
  <div>
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Meus Chamados</h1>
        <p class="text-sm text-gray-500 mt-1">Acompanhe o status das suas solicitações</p>
      </div>
      <router-link to="/portal/new" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        Novo Chamado
      </router-link>
    </div>

    <!-- State Filter Tabs -->
    <div class="flex gap-4 mb-6 border-b border-gray-200">
      <button 
        @click="filterState = 'open'"
        :class="['pb-2 px-1 text-sm font-medium border-b-2 transition-colors', filterState === 'open' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
        Abertos / Pendentes
      </button>
      <button 
        @click="filterState = 'closed'"
        :class="['pb-2 px-1 text-sm font-medium border-b-2 transition-colors', filterState === 'closed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
        Concluídos
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center p-12">
      <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
    </div>

    <div v-else-if="filteredTickets.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <InboxIcon class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">Nenhum chamado encontrado</h3>
      <p class="text-gray-500 mb-6">Você não possui chamados {{ filterState === 'open' ? 'em andamento' : 'concluídos' }} no momento.</p>
      <router-link v-if="filterState === 'open'" to="/portal/new" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
        <PlusIcon class="w-4 h-4" />
        Criar meu primeiro chamado
      </router-link>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th class="p-4 w-20">ID</th>
            <th class="p-4">Assunto</th>
            <th class="p-4 w-32 text-center">Status</th>
            <th class="p-4 w-48 text-right">Data de Criação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-sm">
          <tr v-for="ticket in filteredTickets" :key="ticket.id" @click="viewTicket(ticket.id)" class="hover:bg-blue-50 cursor-pointer transition-colors group">
            <td class="p-4 font-medium text-gray-500 group-hover:text-blue-600">#{{ ticket.id }}</td>
            <td class="p-4">
              <div class="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{{ ticket.title }}</div>
            </td>
            <td class="p-4 text-center">
              <span :class="getStatusBadgeClass(ticket.state_id)" class="px-2.5 py-1 rounded-full text-xs font-medium">
                {{ getStatusLabel(ticket.state_id) }}
              </span>
            </td>
            <td class="p-4 text-right text-gray-500">
              {{ formatDate(ticket.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus as PlusIcon, Inbox as InboxIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { error: toastError } = useToast()

const tickets = ref<any[]>([])
const isLoading = ref(true)
const filterState = ref<'open' | 'closed'>('open')

onMounted(async () => {
  await fetchTickets()
})

const fetchTickets = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/tickets')
    tickets.value = res.data
  } catch (err: any) {
    toastError('Erro', 'Não foi possível carregar os chamados.')
  } finally {
    isLoading.value = false
  }
}

const filteredTickets = computed(() => {
  return tickets.value.filter(t => {
    if (filterState.value === 'open') {
      return t.state_id !== 4 // Not Closed
    } else {
      return t.state_id === 4 // Closed
    }
  })
})

const viewTicket = (id: number) => {
  // We can reuse the ticket detail view but route it through /portal/tickets/:id
  // Actually, we don't have a CustomerTicketDetail yet, we'll route to /portal/tickets/:id 
  // Let's just create a basic customer ticket detail or reuse the existing if it doesn't have sidebar.
  // We will create the route shortly.
  router.push(`/portal/tickets/${id}`)
}

const getStatusLabel = (stateId: number) => {
  const map: Record<number, string> = {
    1: 'Aberto',
    2: 'Pendente',
    3: 'Pendente Retorno',
    4: 'Fechado'
  }
  return map[stateId] || 'Desconhecido'
}

const getStatusBadgeClass = (stateId: number) => {
  switch (stateId) {
    case 1: return 'bg-blue-100 text-blue-700'
    case 2: return 'bg-orange-100 text-orange-700'
    case 3: return 'bg-purple-100 text-purple-700'
    case 4: return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
