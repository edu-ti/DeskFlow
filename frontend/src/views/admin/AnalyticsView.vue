<template>
  <div class="space-y-6 pb-12 max-w-7xl mx-auto">
    <!-- Header with Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
      <div>
        <h1 class="text-xl font-extrabold text-gray-900">Relatórios & Analytics Executivos</h1>
        <p class="text-xs text-gray-500 mt-0.5">Métricas de conformidade de SLA, produtividade da equipe, CSAT e modalidades de atendimento</p>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Filter -->
        <select 
          v-model="filters.period" 
          @change="fetchData"
          class="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-df-primary/20"
        >
          <option value="all">Todo o período</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="15d">Últimos 15 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 3 meses</option>
        </select>

        <!-- Group Filter -->
        <select 
          v-model="filters.groupId" 
          @change="fetchData"
          class="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-df-primary/20 min-w-[140px]"
        >
          <option value="all">Todos os Grupos</option>
          <option v-for="group in groups" :key="group.id" :value="String(group.id)">{{ group.name }}</option>
        </select>
        
        <!-- Refresh Button -->
        <button 
          @click="fetchData" 
          :disabled="isLoading"
          class="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <!-- Export Buttons -->
        <div class="flex gap-2">
          <button 
            @click="exportData" 
            :disabled="isExporting"
            class="bg-df-primary hover:bg-df-primary-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            title="Exportar CSV"
          >
            <DownloadIcon class="w-3.5 h-3.5" />
            <span>{{ isExporting ? 'Exportando...' : 'CSV' }}</span>
          </button>

          <button 
            @click="exportPdf" 
            :disabled="isExportingPdf"
            class="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            title="Exportar PDF"
          >
            <FileTextIcon class="w-3.5 h-3.5" />
            <span>{{ isExportingPdf ? 'Gerando...' : 'PDF' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Report Content -->
    <div id="analytics-report-content" class="space-y-6">
      <div v-if="isLoading" class="flex justify-center py-16 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
        <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
      </div>

      <div v-else class="space-y-6">
        <!-- KPIs Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-500 mb-1">Total de Chamados</p>
            <div class="flex items-baseline justify-between mt-2">
              <h3 class="text-2xl font-extrabold text-gray-900">{{ kpis.totalTickets }}</h3>
              <div class="p-2 bg-blue-50 text-blue-600 rounded-xl"><InboxIcon class="w-4 h-4" /></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-500 mb-1">Taxa Cumprimento SLA</p>
            <div class="flex items-baseline justify-between mt-2">
              <h3 class="text-2xl font-extrabold text-emerald-600">{{ kpis.slaComplianceRate }}%</h3>
              <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheckIcon class="w-4 h-4" /></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-500 mb-1">Chamados Resolvidos</p>
            <div class="flex items-baseline justify-between mt-2">
              <h3 class="text-2xl font-extrabold text-gray-900">{{ kpis.resolvedTickets }}</h3>
              <div class="p-2 bg-green-50 text-green-600 rounded-xl"><CheckCircleIcon class="w-4 h-4" /></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-500 mb-1">Tempo Méd. Resolução</p>
            <div class="flex items-baseline justify-between mt-2">
              <h3 class="text-2xl font-extrabold text-gray-900">{{ kpis.avgResolutionTimeHours }}<span class="text-sm font-medium text-gray-400 ml-0.5">h</span></h3>
              <div class="p-2 bg-purple-50 text-purple-600 rounded-xl"><ClockIcon class="w-4 h-4" /></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-500 mb-1">Satisfação (CSAT)</p>
            <div class="flex items-baseline justify-between mt-2">
              <h3 class="text-2xl font-extrabold text-amber-500">{{ kpis.csatScore > 0 ? kpis.csatScore : '-' }}<span v-if="kpis.csatScore > 0" class="text-sm font-medium text-gray-400 ml-0.5">/5</span></h3>
              <div class="p-2 bg-amber-50 text-amber-600 rounded-xl"><StarIcon class="w-4 h-4" /></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
            <p class="text-xs font-semibold text-gray-500 mb-1">Presencial vs Remoto</p>
            <div class="flex items-baseline justify-between mt-2">
              <h3 class="text-lg font-extrabold text-gray-900">{{ kpis.onsiteTickets }}p <span class="text-xs font-normal text-gray-400">/ {{ kpis.remoteTickets }}r</span></h3>
              <div class="p-2 bg-slate-100 text-slate-700 rounded-xl"><MapPinIcon class="w-4 h-4" /></div>
            </div>
          </div>
          
        </div>

        <!-- Main Line Chart (Timeline) -->
        <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6">
          <h2 class="text-sm font-bold text-gray-900 mb-4">Volume Histórico de Chamados (Abertos vs Resolvidos)</h2>
          <div class="h-[280px]">
            <Line v-if="timelineChartData" :data="timelineChartData" :options="lineOptions" />
            <div v-else class="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados no período</div>
          </div>
        </div>

        <!-- Charts Grid: Status & Ranking -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Status Chart (Doughnut) -->
          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5">
            <h2 class="text-sm font-bold text-gray-900 mb-4">Distribuição por Status</h2>
            <div class="h-[240px] flex justify-center">
              <Doughnut v-if="statusChartData" :data="statusChartData" :options="doughnutOptions" />
              <div v-else class="text-gray-400 h-full flex items-center justify-center text-xs">Sem dados</div>
            </div>
          </div>

          <!-- Executive Ranking Table -->
          <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 lg:col-span-2 flex flex-col">
            <h2 class="text-sm font-bold text-gray-900 mb-4">Ranking de Desempenho dos Técnicos</h2>
            <div class="flex-1 overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th class="pb-2.5">Técnico</th>
                    <th class="pb-2.5 text-center">Chamados</th>
                    <th class="pb-2.5 text-center">Resolvidos</th>
                    <th class="pb-2.5 text-center">SLA Cumprido</th>
                    <th class="pb-2.5 text-center">Média CSAT</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 font-medium">
                  <tr v-for="r in executiveRanking" :key="r.technician" class="hover:bg-gray-50/60 transition-colors">
                    <td class="py-3 font-bold text-gray-900 flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-df-primary/15 text-df-primary flex items-center justify-center text-[10px] font-extrabold">
                        {{ r.technician.charAt(0) }}
                      </div>
                      <span>{{ r.technician }}</span>
                    </td>
                    <td class="py-3 text-center text-gray-700 font-bold">{{ r.totalTickets }}</td>
                    <td class="py-3 text-center text-emerald-600 font-bold">{{ r.resolvedTickets }}</td>
                    <td class="py-3 text-center">
                      <span 
                        :class="r.slaComplianceRate >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                        class="px-2 py-0.5 rounded-md font-bold border text-[11px]"
                      >
                        {{ r.slaComplianceRate }}%
                      </span>
                    </td>
                    <td class="py-3 text-center font-bold text-amber-500">
                      {{ r.avgCsat !== '—' ? `${r.avgCsat} ★` : '—' }}
                    </td>
                  </tr>
                  <tr v-if="executiveRanking.length === 0">
                    <td colspan="5" class="py-6 text-center text-gray-400 font-normal">Nenhum registro de produtividade encontrado.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  RefreshCw as RefreshCwIcon, 
  Loader2 as Loader2Icon, 
  Inbox as InboxIcon, 
  CheckCircle as CheckCircleIcon, 
  Clock as ClockIcon, 
  Star as StarIcon, 
  Download as DownloadIcon, 
  FileText as FileTextIcon, 
  ShieldCheck as ShieldCheckIcon,
  MapPin as MapPinIcon 
} from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Chart.js imports
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title,
  Filler
} from 'chart.js'
import { Doughnut, Line } from 'vue-chartjs'

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title,
  Filler
)

const { success: toastSuccess, error: toastError } = useToast()

const isLoading = ref(true)
const isExporting = ref(false)
const isExportingPdf = ref(false)

const filters = ref({
  period: 'all',
  groupId: 'all'
})

const groups = ref<any[]>([])

const kpis = ref({
  totalTickets: 0,
  resolvedTickets: 0,
  openTickets: 0,
  escalatedTickets: 0,
  slaComplianceRate: 100,
  avgResolutionTimeHours: '0.0',
  csatScore: 0,
  totalCsatAnswers: 0,
  remoteTickets: 0,
  onsiteTickets: 0,
})

const executiveRanking = ref<any[]>([])
const statusChartData = ref<any>(null)
const timelineChartData = ref<any>(null)

// Chart Options
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const }
  }
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: { position: 'top' as const }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0 }
    }
  }
}

const statusColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280']

onMounted(async () => {
  await fetchGroups()
  await fetchData()
})

const fetchGroups = async () => {
  try {
    const res = await api.get('/groups')
    groups.value = res.data
  } catch (error) {
    console.error('Error fetching groups')
  }
}

const getQueryParams = () => {
  const params = new URLSearchParams()
  params.append('period', filters.value.period)
  if (filters.value.groupId !== 'all') {
    params.append('groupId', filters.value.groupId)
  }
  return params.toString()
}

const fetchData = async () => {
  isLoading.value = true
  const qStr = getQueryParams()
  
  try {
    const [kpisRes, statusRes, timelineRes, rankingRes] = await Promise.all([
      api.get(`/analytics/kpis?${qStr}`),
      api.get(`/analytics/tickets-by-status?${qStr}`),
      api.get(`/analytics/timeline?${qStr}`),
      api.get(`/analytics/executive-ranking?${qStr}`)
    ])

    kpis.value = kpisRes.data
    executiveRanking.value = rankingRes.data

    // Doughnut
    if (statusRes.data.length > 0) {
      statusChartData.value = {
        labels: statusRes.data.map((item: any) => item.status),
        datasets: [{
          data: statusRes.data.map((item: any) => item.count),
          backgroundColor: statusColors.slice(0, statusRes.data.length),
          borderWidth: 1
        }]
      }
    } else {
      statusChartData.value = null
    }

    // Line Timeline
    if (timelineRes.data.length > 0) {
      timelineChartData.value = {
        labels: timelineRes.data.map((item: any) => item.date),
        datasets: [
          {
            label: 'Novos Chamados',
            data: timelineRes.data.map((item: any) => item.opened),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          },
          {
            label: 'Resolvidos',
            data: timelineRes.data.map((item: any) => item.resolved),
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3
          }
        ]
      }
    } else {
      timelineChartData.value = null
    }

  } catch (error) {
    console.error('Error loading analytics', error)
    toastError('Erro', 'Falha ao carregar métricas de atendimento.')
  } finally {
    isLoading.value = false
  }
}

const exportData = async () => {
  isExporting.value = true
  const qStr = getQueryParams()
  try {
    const res = await api.get(`/analytics/export?${qStr}`)
    const blob = new Blob([res.data.data], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_deskflow_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Sucesso', 'Relatório CSV exportado.')
  } catch (error) {
    toastError('Erro', 'Não foi possível exportar os dados.')
  } finally {
    isExporting.value = false
  }
}

const exportPdf = async () => {
  isExportingPdf.value = true
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    
    // Header
    doc.setFontSize(18)
    doc.setTextColor(30, 41, 59)
    doc.text('DeskFlow - Relatório Executivo de Atendimento', 14, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Período: ${filters.value.period}`, 14, 28)

    // Summary Box
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 34, 182, 28, 3, 3, 'FD')

    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(`Total de Chamados: ${kpis.value.totalTickets}`, 20, 43)
    doc.text(`Resolvidos: ${kpis.value.resolvedTickets}`, 20, 51)
    doc.text(`Taxa SLA: ${kpis.value.slaComplianceRate}%`, 80, 43)
    doc.text(`Tempo Médio: ${kpis.value.avgResolutionTimeHours}h`, 80, 51)
    doc.text(`CSAT Médio: ${kpis.value.csatScore > 0 ? kpis.value.csatScore : '—'}/5`, 140, 43)
    doc.text(`Presencial/Remoto: ${kpis.value.onsiteTickets}/${kpis.value.remoteTickets}`, 140, 51)

    // Table
    const tableBody = executiveRanking.value.map(r => [
      r.technician,
      r.totalTickets,
      r.resolvedTickets,
      `${r.slaComplianceRate}%`,
      r.avgCsat !== '—' ? `${r.avgCsat} / 5` : '—'
    ])

    autoTable(doc, {
      startY: 70,
      head: [['Técnico / Atendente', 'Total Chamados', 'Resolvidos', 'SLA Cumprido', 'Média CSAT']],
      body: tableBody,
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3.5 }
    })

    doc.save(`relatorio_executivo_deskflow_${Date.now()}.pdf`)
    toastSuccess('Sucesso', 'PDF executivo exportado com sucesso.')
  } catch (error) {
    console.error('Error generating PDF', error)
    toastError('Erro', 'Falha ao gerar o PDF.')
  } finally {
    isExportingPdf.value = false
  }
}
</script>
