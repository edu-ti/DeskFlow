<template>
  <div class="max-w-7xl mx-auto space-y-8 pb-12">
    <!-- Top Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-gray-900">Dashboard Executivo</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Em Tempo Real
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Visão geral e inteligência operacional do seu suporte e service desk</p>
      </div>

      <!-- Actions & Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Period Selector -->
        <div class="bg-white border border-gray-200/80 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-sm">
          <CalendarIcon class="w-4 h-4 text-gray-400" />
          <select 
            v-model="daysFilter" 
            class="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer pr-2"
          >
            <option :value="7">Últimos 7 dias</option>
            <option :value="15">Últimos 15 dias</option>
            <option :value="30">Últimos 30 dias</option>
            <option :value="90">Últimos 3 meses</option>
            <option :value="undefined">Todo o período</option>
          </select>
        </div>

        <!-- Export CSV Button -->
        <button 
          @click="exportCsv"
          :disabled="isExporting"
          class="inline-flex items-center gap-2 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <DownloadIcon class="w-4 h-4 text-gray-500" />
          <span>{{ isExporting ? 'Exportando...' : 'Exportar CSV' }}</span>
        </button>

        <!-- New Ticket Quick Action -->
        <router-link 
          to="/tickets" 
          class="inline-flex items-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Ver Chamados</span>
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
      <Loader2Icon class="w-8 h-8 animate-spin text-df-primary" />
      <span class="text-sm font-medium">Carregando métricas e indicadores...</span>
    </div>

    <template v-else-if="stats">
      <!-- KPI Metric Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Total Tickets -->
        <div class="bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Volume Total</span>
            <div class="p-2.5 bg-blue-50 text-df-primary rounded-xl group-hover:scale-110 transition-transform">
              <InboxIcon class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 tracking-tight">{{ stats.overview.totalTickets }}</h3>
          <div class="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>Taxa de Resolução</span>
            <span class="font-semibold text-emerald-600">{{ resolutionRate }}%</span>
          </div>
        </div>

        <!-- Open / Pending Tickets -->
        <div class="bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Fila em Aberto</span>
            <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <ClockIcon class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 tracking-tight">{{ stats.overview.openTickets }}</h3>
          <div class="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>Aguardando Resposta</span>
            <span class="font-medium text-amber-600">Ação Necessária</span>
          </div>
        </div>

        <!-- Resolved Tickets -->
        <div class="bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Resolvidos</span>
            <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircleIcon class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 tracking-tight">{{ stats.overview.resolvedTickets }}</h3>
          <div class="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>Concluídos com Sucesso</span>
            <span class="font-medium text-emerald-600">Finalizados</span>
          </div>
        </div>

        <!-- SLA Breaches / Avg Response -->
        <div class="bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Tempo Médio (TMR)</span>
            <div class="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <ZapIcon class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 tracking-tight">{{ formatMinutes(stats.avgResponseTime) }}</h3>
          <div class="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>SLA Violados:</span>
            <span class="font-bold" :class="stats.overview.breachedSla > 0 ? 'text-red-600' : 'text-emerald-600'">
              {{ stats.overview.breachedSla }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Visualizations Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Area Chart: Timeline Trend -->
        <div class="lg:col-span-2 bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-base font-bold text-gray-900">Evolução do Volume de Chamados</h3>
              <p class="text-xs text-gray-500 mt-0.5">Histórico diário de abertura de solicitações</p>
            </div>
          </div>
          <div v-if="stats.timeline && stats.timeline.length > 0" class="h-[320px]">
            <apexchart type="area" height="320" :options="timelineOptions" :series="timelineSeries"></apexchart>
          </div>
          <div v-else class="h-[320px] flex items-center justify-center text-gray-400 text-sm">
            Sem dados no período selecionado
          </div>
        </div>

        <!-- Donut Chart: Status Breakdown -->
        <div class="bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-gray-900">Distribuição por Status</h3>
            <p class="text-xs text-gray-500 mt-0.5">Visão percentual do ciclo de vida</p>
          </div>
          <div v-if="statusSeries.length > 0" class="flex justify-center items-center my-4 h-[260px]">
            <apexchart type="donut" width="100%" :options="statusOptions" :series="statusSeries"></apexchart>
          </div>
          <div v-else class="h-[260px] flex items-center justify-center text-gray-400 text-sm">
            Sem dados suficientes
          </div>
        </div>
      </div>

      <!-- Bottom Grid: Productivity & Quick Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Top Resolving Agents -->
        <div class="lg:col-span-2 bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-base font-bold text-gray-900">Ranking de Produtividade dos Agentes</h3>
              <p class="text-xs text-gray-500 mt-0.5">Agentes com maior número de chamados resolvidos</p>
            </div>
            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <AwardIcon class="w-5 h-5" />
            </div>
          </div>

          <div v-if="stats.closedByAgent && stats.closedByAgent.length > 0" class="space-y-4">
            <div 
              v-for="(agent, idx) in stats.closedByAgent" 
              :key="agent.name"
              class="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-colors"
            >
              <div class="flex items-center gap-3.5">
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                  :class="idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-df-primary'"
                >
                  #{{ idx + 1 }}
                </div>
                <div>
                  <span class="font-semibold text-gray-900 block leading-tight">{{ agent.name }}</span>
                  <span class="text-xs text-gray-400">Especialista de Atendimento</span>
                </div>
              </div>

              <div class="flex items-center gap-2 font-mono font-bold text-sm text-df-primary bg-blue-50 px-3 py-1 rounded-lg">
                <span>{{ agent.count }}</span>
                <span class="text-xs font-normal text-gray-500">resolvidos</span>
              </div>
            </div>
          </div>

          <div v-else class="py-12 text-center text-gray-400 text-sm">
            Nenhum chamado concluído por agente registrado no período.
          </div>
        </div>

        <!-- Quick Summary & System Health -->
        <div class="bg-white border border-gray-200/80 shadow-sm p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-gray-900 mb-1">Canais & Canais Ativos</h3>
            <p class="text-xs text-gray-500 mb-6">Integrações de atendimento conectadas</p>

            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-100 text-df-primary rounded-lg">
                    <GlobeIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-800 block">Portal Web / Service Desk</span>
                    <span class="text-xs text-gray-400">Atendimento ao cliente</span>
                  </div>
                </div>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <MessageSquareIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-800 block">WhatsApp & Chat</span>
                    <span class="text-xs text-gray-400">Omnichannel</span>
                  </div>
                </div>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <MailIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-gray-800 block">E-mail (IMAP / SMTP)</span>
                    <span class="text-xs text-gray-400">Processador automático</span>
                  </div>
                </div>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500" title="Configuração padrão"></span>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100">
            <router-link 
              to="/omnichannel" 
              class="w-full inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-semibold transition-colors border border-gray-200"
            >
              <span>Abrir Central Omnichannel</span>
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { 
  Inbox as InboxIcon, 
  Clock as ClockIcon, 
  CheckCircle as CheckCircleIcon, 
  Zap as ZapIcon, 
  Calendar as CalendarIcon, 
  Download as DownloadIcon, 
  Plus as PlusIcon, 
  Loader2 as Loader2Icon, 
  Award as AwardIcon, 
  Globe as GlobeIcon, 
  MessageSquare as MessageSquareIcon, 
  Mail as MailIcon, 
  ArrowRight as ArrowRightIcon 
} from 'lucide-vue-next';
import { reportsService, type DashboardStats } from '../../services/reportsService';

const stats = ref<DashboardStats | null>(null);
const isLoading = ref(true);
const isExporting = ref(false);
const daysFilter = ref<number | undefined>(7);

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

const exportCsv = async () => {
  isExporting.value = true;
  try {
    await reportsService.exportCsv(daysFilter.value);
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
  } finally {
    isExporting.value = false;
  }
};

const resolutionRate = computed(() => {
  if (!stats.value || stats.value.overview.totalTickets === 0) return 0;
  return Math.round((stats.value.overview.resolvedTickets / stats.value.overview.totalTickets) * 100);
});

const formatMinutes = (minutes: number) => {
  if (!minutes || minutes === 0) return 'Instantâneo';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ApexCharts Configurations
const commonChartOptions = {
  chart: {
    foreColor: '#6B7280',
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  theme: { mode: 'light' as const },
  grid: {
    borderColor: 'rgba(0, 0, 0, 0.05)',
    strokeDashArray: 3,
  },
  tooltip: {
    theme: 'light'
  }
};

// Timeline Area Chart
const timelineSeries = computed(() => {
  if (!stats.value || !stats.value.timeline) return [];
  return [{
    name: 'Chamados Criados',
    data: stats.value.timeline.map(t => t.count)
  }];
});

const timelineOptions = computed(() => {
  if (!stats.value || !stats.value.timeline) return {};
  return {
    ...commonChartOptions,
    chart: { 
      ...commonChartOptions.chart, 
      type: 'area', 
      height: 320,
      zoom: { enabled: false }
    },
    colors: ['#007AFF'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 100]
      }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    xaxis: {
      categories: stats.value.timeline.map(t => t.date),
      labels: { 
        style: { colors: '#9CA3AF', fontSize: '11px' } 
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { 
        style: { colors: '#9CA3AF', fontSize: '11px' },
        formatter: (val: number) => Math.round(val).toString()
      }
    }
  };
});

// Status Donut Chart
const statusSeries = computed(() => {
  if (!stats.value || !stats.value.byStatus) return [];
  return Object.values(stats.value.byStatus);
});

const statusOptions = computed(() => {
  if (!stats.value || !stats.value.byStatus) return {};
  const labels = Object.keys(stats.value.byStatus);
  return {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'donut', height: 260 },
    labels,
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#6B7280' 
            },
            value: { 
              fontSize: '22px', 
              fontWeight: 700, 
              color: '#111827' 
            },
            total: {
              show: true,
              color: '#6B7280',
              label: 'Total',
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      markers: { radius: 12 }
    }
  };
});
</script>
