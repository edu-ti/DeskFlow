<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-df-text">Dashboard</h1>
        <p class="text-df-text-muted text-sm mt-1">System overview and ticket metrics</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center p-12">
      <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
    </div>

    <template v-else>
      <!-- Top Row: Status dos Tickets -->
      <div class="glass-panel p-6 rounded-xl flex items-center gap-12">
        <div class="flex-shrink-0">
          <h3 class="text-sm font-semibold text-df-text mb-4">Status dos tickets</h3>
        </div>
        <div class="flex items-center gap-16 flex-1">
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-df-text">{{ stats?.status?.open || 0 }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">Aberto</span>
          </div>
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-df-text">{{ stats?.status?.pending || 0 }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">Pendente</span>
          </div>
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-df-text">{{ stats?.status?.overdue || 0 }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">Vencido</span>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Tickets Críticos e Vencidos (Table) -->
        <div class="glass-panel rounded-xl flex flex-col h-[400px]">
          <div class="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-df-text flex items-center gap-2">
              Tickets críticos e vencidos
              <HelpCircleIcon class="w-3.5 h-3.5 text-df-text-muted" />
            </h3>
          </div>
          <div class="flex-1 overflow-auto custom-scrollbar p-0">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-white/5 text-xs text-df-text-muted uppercase tracking-wider sticky top-0">
                  <th class="py-3 px-5 font-semibold">Detalhes</th>
                  <th class="py-3 px-5 font-semibold w-24">SLA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="stats?.criticalTickets?.length === 0">
                  <td colspan="2" class="py-8 text-center text-sm text-df-text-muted">Nenhum ticket vencido 🎉</td>
                </tr>
                <tr 
                  v-for="ticket in stats?.criticalTickets" 
                  :key="ticket.id"
                  @click="router.push(`/tickets/${ticket.id}`)"
                  class="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td class="py-3 px-5">
                    <div class="text-sm font-medium text-df-text">#{{ ticket.id }} - {{ ticket.title }}</div>
                  </td>
                  <td class="py-3 px-5">
                    <span class="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded">Estourado</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Atividade de tickets (Chart) -->
        <div class="glass-panel rounded-xl p-5 flex flex-col h-[400px]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-semibold text-df-text flex items-center gap-2">
              Atividade de tickets
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
        <div class="glass-panel rounded-xl p-5 lg:col-span-2 flex items-center justify-around py-8">
          <div class="text-center">
            <h4 class="text-3xl font-bold text-df-text mb-2">{{ stats?.avgStats?.firstResponse || '0m' }}</h4>
            <p class="text-xs text-df-text-muted">Tempo médio de primeira resposta</p>
          </div>
          <div class="w-px h-16 bg-white/10"></div>
          <div class="text-center">
            <h4 class="text-3xl font-bold text-df-text mb-2">{{ stats?.avgStats?.closeTime || '0m' }}</h4>
            <p class="text-xs text-df-text-muted">Tempo médio de fechamento</p>
          </div>
          <div class="w-px h-16 bg-white/10"></div>
          <div class="text-center">
            <h4 class="text-3xl font-bold text-df-text mb-2">{{ stats?.avgStats?.timeEntry || '0m' }}</h4>
            <p class="text-xs text-df-text-muted">Duração média de entrada de tempo</p>
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
        backgroundColor: '#4ade80', // df-primary (green)
        data: stats.value.activity.map((a: any) => a.open),
        barPercentage: 0.5,
        categoryPercentage: 0.8
      },
      {
        label: 'Resolvido',
        backgroundColor: '#10b981', // df-accent
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
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#fff',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(255,255,255,0.1)',
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
        color: '#94a3b8'
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: '#94a3b8',
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
