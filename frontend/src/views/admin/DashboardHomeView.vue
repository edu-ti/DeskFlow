<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { ActivityIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon, FilterIcon, DownloadIcon } from 'lucide-vue-next';
import { reportsService, type DashboardStats } from '../../services/reportsService';

const stats = ref<DashboardStats | null>(null);
const isLoading = ref(true);
const daysFilter = ref<number | undefined>(7); // Default to last 7 days

const loadStats = async () => {
  isLoading.value = true;
  try {
    stats.value = await reportsService.getDashboardStats(daysFilter.value);
  } catch (err) {
    console.error('Failed to load dashboard stats', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStats();
});

watch(daysFilter, () => {
  loadStats();
});

// handleExport removed, moved to AnalyticsView

// Chart Options - Common Theme
const commonChartOptions = {
  chart: {
    foreColor: '#6B7280', // gray-500
    toolbar: { show: false },
    background: 'transparent'
  },
  theme: { mode: 'light' },
  grid: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    strokeDashArray: 4,
  },
  tooltip: {
    theme: 'light'
  }
};

// Timeline Chart (Area)
const timelineSeries = computed(() => {
  if (!stats.value) return [];
  return [{
    name: 'Novos Chamados',
    data: stats.value.timeline.map(t => t.count)
  }];
});

const timelineOptions = computed(() => {
  if (!stats.value) return {};
  return {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'area', height: 350 },
    colors: ['#007AFF'], // df-primary
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: stats.value.timeline.map(t => t.date),
      labels: { style: { colors: '#6B7280' } }
    },
    yaxis: {
      labels: { style: { colors: '#6B7280' } }
    }
  };
});

// Status Chart (Donut)
const statusSeries = computed(() => {
  if (!stats.value) return [];
  return Object.values(stats.value.byStatus);
});

const statusOptions = computed(() => {
  if (!stats.value) return {};
  return {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'donut', height: 350 },
    labels: Object.keys(stats.value.byStatus),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { color: '#6B7280' },
            value: { color: '#1F2937' },
            total: {
              show: true,
              color: '#6B7280',
              label: 'Total',
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
              }
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: false }
  };
});

// Bar chart for closedByAgent
const agentSeries = computed(() => {
  if (!stats.value) return [];
  return [{
    name: 'Chamados Fechados',
    data: stats.value.closedByAgent.map(a => a.count)
  }];
});

const agentOptions = computed(() => {
  if (!stats.value) return {};
  return {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'bar', height: 350 },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: stats.value.closedByAgent.map(a => a.name),
      labels: { style: { colors: '#6B7280' } }
    },
    yaxis: {
      labels: { style: { colors: '#6B7280' } }
    }
  };
});

const formatMinutes = (minutes: number) => {
  if (minutes === 0) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};
</script>

<template>
  <div class="max-w-7xl mx-auto py-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p class="text-gray-500">Visão geral do desempenho do seu suporte.</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
          <FilterIcon class="w-4 h-4 text-gray-500" />
          <select v-model="daysFilter" class="bg-transparent text-gray-800 text-sm focus:outline-none cursor-pointer">
            <option :value="7">Últimos 7 Dias</option>
            <option :value="15">Últimos 15 Dias</option>
            <option :value="30">Últimos 30 Dias</option>
            <option :value="undefined">Todo o Período</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="p-12 text-center text-gray-500">
      Carregando métricas...
    </div>

    <template v-else-if="stats">
      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ActivityIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-gray-500 mb-1">Tempo Médio de Resposta</p>
          <h3 class="text-3xl font-bold text-gray-800">{{ formatMinutes(stats.avgResponseTime) }}</h3>
        </div>

        <div class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <ClockIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-gray-500 mb-1">Chamados Abertos</p>
          <h3 class="text-3xl font-bold text-gray-800">{{ stats.overview.openTickets }}</h3>
        </div>

        <div class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircleIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-gray-500 mb-1">Chamados Resolvidos</p>
          <h3 class="text-3xl font-bold text-gray-800">{{ stats.overview.resolvedTickets }}</h3>
        </div>

        <div class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertCircleIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-gray-500 mb-1">SLA Violado</p>
          <h3 class="text-3xl font-bold text-gray-800">{{ stats.overview.breachedSla }}</h3>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white border border-gray-200 shadow-sm p-6 rounded-2xl">
          <h3 class="text-lg font-medium text-gray-800 mb-6">Volume de Chamados</h3>
          <apexchart type="area" height="350" :options="timelineOptions" :series="timelineSeries"></apexchart>
        </div>
        <div class="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl">
          <h3 class="text-lg font-medium text-gray-800 mb-6">Chamados por Status</h3>
          <div class="flex justify-center items-center h-[350px]">
            <apexchart type="donut" width="100%" :options="statusOptions" :series="statusSeries"></apexchart>
          </div>
        </div>
        <div class="lg:col-span-3 bg-white border border-gray-200 shadow-sm p-6 rounded-2xl mt-6">
          <h3 class="text-lg font-medium text-gray-800 mb-6">Melhores Agentes (Chamados Fechados)</h3>
          <apexchart type="bar" height="350" :options="agentOptions" :series="agentSeries"></apexchart>
        </div>
      </div>
    </template>
  </div>
</template>
