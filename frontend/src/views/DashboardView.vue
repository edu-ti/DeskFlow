<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Painel de Controle</h1>
        <p class="text-gray-500 text-sm mt-1">Visão geral do sistema e métricas de chamados</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center p-12">
      <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
    </div>

    <template v-else>
      <!-- Top Row: Status dos Tickets -->
      <div class="bg-white border border-gray-200 shadow-sm p-6 rounded-xl flex items-center gap-12">
        <div class="flex-shrink-0">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Status dos chamados</h3>
        </div>
        <div class="flex items-center gap-16 flex-1">
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-gray-800">{{ stats?.status?.open || 0 }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">Aberto</span>
          </div>
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-gray-800">{{ stats?.status?.pending || 0 }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Pendente</span>
          </div>
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-gray-800">{{ stats?.status?.overdue || 0 }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Vencido</span>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Tickets Críticos e Vencidos (Table) -->
        <div class="bg-white border border-gray-200 shadow-sm rounded-xl flex flex-col h-[400px]">
          <div class="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Chamados críticos e vencidos
              <HelpCircleIcon class="w-3.5 h-3.5 text-gray-400" />
            </h3>
          </div>
          <div class="flex-1 overflow-auto custom-scrollbar p-0">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider sticky top-0">
                  <th class="py-3 px-5 font-semibold">Detalhes</th>
                  <th class="py-3 px-5 font-semibold w-24">SLA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="stats?.criticalTickets?.length === 0">
                  <td colspan="2" class="py-8 text-center text-sm text-gray-400">Nenhum chamado vencido 🎉</td>
                </tr>
                <tr 
                  v-for="ticket in stats?.criticalTickets" 
                  :key="ticket.id"
                  @click="router.push(`/tickets/${ticket.id}`)"
                  class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td class="py-3 px-5">
                    <div class="text-sm font-medium text-gray-800">#{{ ticket.id }} - {{ ticket.title }}</div>
                  </td>
                  <td class="py-3 px-5">
                    <span class="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">Estourado</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Atividade de tickets (Chart) -->
        <div class="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col h-[400px]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Atividade de chamados
            </h3>
            <div class="flex items-center gap-4 text-xs font-medium">
              <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded bg-df-primary"></span> Aberto</div>
              <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded bg-df-accent"></span> Resolvido</div>
            </div>
          </div>
          <div class="flex-1 relative">
            <Bar v-if="chartData" :data="chartData" :options="chartOptions as any" />
          </div>
        </div>

        <!-- Estatísticas médias de SLA -->
        <div class="bg-white border border-gray-200 shadow-sm rounded-xl p-5 lg:col-span-2 flex items-center justify-around py-8">
          <div class="text-center">
            <h4 class="text-3xl font-bold text-gray-800 mb-2">{{ stats?.avgStats?.firstResponse || '0m' }}</h4>
            <p class="text-xs text-gray-500">Tempo médio de primeira resposta</p>
          </div>
          <div class="w-px h-16 bg-gray-200"></div>
          <div class="text-center">
            <h4 class="text-3xl font-bold text-gray-800 mb-2">{{ stats?.avgStats?.closeTime || '0m' }}</h4>
            <p class="text-xs text-gray-500">Tempo médio de fechamento</p>
          </div>
          <div class="w-px h-16 bg-gray-200"></div>
          <div class="text-center">
            <h4 class="text-3xl font-bold text-gray-800 mb-2">{{ stats?.avgStats?.timeEntry || '0m' }}</h4>
            <p class="text-xs text-gray-500">Duração média de entrada de tempo</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 as Loader2Icon, HelpCircle as HelpCircleIcon } from 'lucide-vue-next'
import { ticketService } from '../services/ticketService'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const router = useRouter()
const stats = ref<any>(null)
const isLoading = ref(true)

const fetchStats = async () => {
  try {
    isLoading.value = true
    stats.value = await ticketService.getDashboardStats()
  } catch (error) {
    console.error("Failed to load dashboard stats", error)
  } finally {
    isLoading.value = false
  }
}

const chartData = computed(() => {
  if (!stats.value?.activity) return null
  
  return {
    labels: stats.value.activity.map((a: any) => a.date),
    datasets: [
      {
        label: 'Aberto',
        backgroundColor: '#0050d2', // df-primary (blue)
        data: stats.value.activity.map((a: any) => a.open),
        barPercentage: 0.5,
        categoryPercentage: 0.8
      },
      {
        label: 'Resolvido',
        backgroundColor: '#00c0db', // df-accent (cyan)
        data: stats.value.activity.map((a: any) => a.resolved),
        barPercentage: 0.5,
        categoryPercentage: 0.8
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        color: '#6b7280'
      }
    },
    y: {
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        color: '#6b7280',
        stepSize: 1
      },
      beginAtZero: true
    }
  }
}

onMounted(() => {
  fetchStats()
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
