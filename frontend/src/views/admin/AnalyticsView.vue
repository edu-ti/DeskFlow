<template>
  <div class="space-y-6 pb-12">
    <!-- Header with Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Relatórios Avançados</h1>
        <p class="text-sm text-gray-500 mt-1">Acompanhe métricas, volume e produtividade do time de atendimento.</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Date Filter -->
        <select 
          v-model="filters.period" 
          @change="fetchData"
          class="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none"
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
          class="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none min-w-[150px]"
        >
          <option value="all">Todos os Grupos</option>
          <option v-for="group in groups" :key="group.id" :value="String(group.id)">{{ group.name }}</option>
        </select>
        
        <!-- Refresh Button -->
        <button 
          @click="fetchData" 
          :disabled="isLoading"
          class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <!-- Export Buttons -->
        <div class="flex gap-2">
          <button 
            @click="exportData" 
            :disabled="isExporting"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Exportar CSV (Dados)"
          >
            <DownloadIcon class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isExporting ? 'Exportando...' : 'CSV' }}</span>
          </button>

          <button 
            @click="exportPdf" 
            :disabled="isExportingPdf"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Exportar PDF (Visual)"
          >
            <FileTextIcon class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isExportingPdf ? 'Gerando...' : 'PDF' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- The wrapper we will capture for the PDF -->
    <div id="analytics-report-content" class="bg-gray-50 pb-12">
      <div v-if="isLoading" class="flex justify-center py-12">
        <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
      </div>

      <div v-else class="space-y-6">
      
      <!-- KPIs Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500 mb-2">Total de Chamados</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-bold text-gray-900">{{ kpis.totalTickets }}</h3>
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><InboxIcon class="w-5 h-5" /></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500 mb-2">Chamados Resolvidos</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-bold text-gray-900">{{ kpis.resolvedTickets }}</h3>
            <div class="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircleIcon class="w-5 h-5" /></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500 mb-2">Pendentes/Abertos</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-bold text-gray-900">{{ kpis.pendingTickets }}</h3>
            <div class="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><ClockIcon class="w-5 h-5" /></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500 mb-2">Tempo Méd. Resolução</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-bold text-gray-900">{{ kpis.avgResolutionTimeHours }}<span class="text-lg text-gray-500 font-medium ml-1">h</span></h3>
            <div class="p-2 bg-purple-50 text-purple-600 rounded-lg"><ZapIcon class="w-5 h-5" /></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500 mb-2">CSAT (Satisfação)</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-bold text-gray-900">{{ kpis.csatScore > 0 ? kpis.csatScore : '-' }}<span v-if="kpis.csatScore > 0" class="text-lg text-gray-500 font-medium ml-1">/ 5</span></h3>
            <div class="p-2 bg-pink-50 text-pink-600 rounded-lg"><StarIcon class="w-5 h-5" /></div>
          </div>
        </div>
        
      </div>

      <!-- Main Line Chart (Timeline) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Volume de Chamados (Abertos vs Resolvidos)</h2>
        <div class="h-[300px]">
          <Line v-if="timelineChartData" :data="timelineChartData" :options="lineOptions" />
          <div v-else class="h-full flex items-center justify-center text-gray-400">Sem dados no período</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Status Chart (Doughnut) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-6">Status Atual</h2>
          <div class="h-[250px] flex justify-center">
            <Doughnut v-if="statusChartData" :data="statusChartData" :options="doughnutOptions" />
            <div v-else class="text-gray-400 h-full flex items-center justify-center">Sem dados</div>
          </div>
        </div>

        <!-- Productivity Chart (Bar Horizontal ou Vertical) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 class="text-base font-semibold text-gray-900 mb-6">Produtividade por Agente (Resolvidos)</h2>
          <div class="h-[250px]">
            <Bar v-if="productivityChartData" :data="productivityChartData" :options="productivityOptions" />
            <div v-else class="text-gray-400 h-full flex items-center justify-center">Sem dados suficientes</div>
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
  Zap as ZapIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  FileText as FileTextIcon
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
import { Doughnut, Bar, Line } from 'vue-chartjs'

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
  pendingTickets: 0,
  escalatedTickets: 0,
  avgResolutionTimeHours: '0.0',
  csatScore: 0
})

const statusChartData = ref<any>(null)
const timelineChartData = ref<any>(null)
const productivityChartData = ref<any>(null)

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

const productivityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
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
    const [kpisRes, statusRes, timelineRes, agentRes] = await Promise.all([
      api.get(`/analytics/kpis?${qStr}`),
      api.get(`/analytics/tickets-by-status?${qStr}`),
      api.get(`/analytics/timeline?${qStr}`),
      api.get(`/analytics/agent-productivity?${qStr}`)
    ])

    kpis.value = kpisRes.data

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

    // Bar Productivity
    if (agentRes.data.length > 0) {
      productivityChartData.value = {
        labels: agentRes.data.map((item: any) => item.agent),
        datasets: [{
          label: 'Chamados Resolvidos',
          data: agentRes.data.map((item: any) => item.count),
          backgroundColor: '#8B5CF6',
          borderRadius: 4
        }]
      }
    } else {
      productivityChartData.value = null
    }

  } catch (error) {
    toastError('Erro', 'Não foi possível carregar os relatórios.')
  } finally {
    isLoading.value = false
  }
}

const exportData = async () => {
  isExporting.value = true
  const qStr = getQueryParams()
  try {
    const res = await api.get(`/analytics/export?${qStr}`)
    
    // Create download link for CSV
    const blob = new Blob([res.data.data], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `deskflow-relatorio-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toastSuccess('Sucesso', 'Relatório exportado com sucesso.')
  } catch (error) {
    toastError('Erro', 'Falha ao exportar dados.')
  } finally {
    isExporting.value = false
  }
}

const exportPdf = async () => {
  isExportingPdf.value = true
  const qStr = getQueryParams()
  
  try {
    // Busca os dados crus (CSV) para montar a tabela no PDF
    const res = await api.get(`/analytics/export?${qStr}`)
    const csvData = res.data.data
    
    // Parse muito simples de CSV (assumindo que o formato é bem previsível vindo da nossa API)
    const rawRows = csvData.split('\n').filter((r: string) => r.trim() !== '')
    
    // Trata as aspas e separa por vírgula corretamente (Regex simples para CSV)
    const parseRow = (rowStr: string) => {
      const result = [];
      let inQuotes = false;
      let val = '';
      for (let i = 0; i < rowStr.length; i++) {
        let c = rowStr[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(val);
          val = '';
        } else {
          val += c;
        }
      }
      result.push(val);
      return result;
    }

    const parsedData = rawRows.map(parseRow)
    const headers = parsedData[0]
    const body = parsedData.slice(1)

    // Inicializa o jsPDF
    const doc = new jsPDF('landscape')
    
    // Cabeçalho
    doc.setFontSize(22)
    doc.setTextColor(31, 41, 55) // text-gray-800
    doc.text('Relatório Analítico de Chamados', 14, 22)
    
    doc.setFontSize(11)
    doc.setTextColor(107, 114, 128) // text-gray-500
    doc.text(`DeskFlow - Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30)
    
    // Seção de KPIs
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.text(`Total de Chamados: ${kpis.value.totalTickets}`, 14, 45)
    doc.text(`Resolvidos: ${kpis.value.resolvedTickets}`, 70, 45)
    doc.text(`Pendentes: ${kpis.value.pendingTickets}`, 120, 45)
    doc.text(`Tempo Médio de Resolução: ${kpis.value.avgResolutionTimeHours}h`, 170, 45)

    // Tabela com listagem de chamados
    autoTable(doc, {
      startY: 55,
      head: [headers],
      body: body,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // bg-blue-600
      alternateRowStyles: { fillColor: [249, 250, 251] }, // bg-gray-50
      margin: { top: 15 }
    })
    
    doc.save(`deskflow-relatorio-pro-${new Date().toISOString().split('T')[0]}.pdf`)
    toastSuccess('Sucesso', 'Relatório PDF nativo gerado com sucesso.')
  } catch (error) {
    console.error('Error generating PDF:', error)
    toastError('Erro', 'Falha ao gerar o PDF.')
  } finally {
    isExportingPdf.value = false
  }
}
</script>

<style scoped>
/* Scoped styles here */
</style>
