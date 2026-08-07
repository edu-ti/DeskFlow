<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { ActivityIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon, FilterIcon } from 'lucide-vue-next';
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

// Chart Options - Common Theme
const commonChartOptions = {
  chart: {
    foreColor: '#9CA3AF', // df-text-muted
    toolbar: { show: false },
    background: 'transparent'
  },
  theme: { mode: 'dark' },
  grid: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    strokeDashArray: 4,
  },
  tooltip: {
    theme: 'dark'
  }
};

// Timeline Chart (Area)
const timelineSeries = computed(() => {
  if (!stats.value) return [];
  return [{
    name: 'New Tickets',
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
      labels: { style: { colors: '#9CA3AF' } }
    },
    yaxis: {
      labels: { style: { colors: '#9CA3AF' } }
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
            name: { color: '#9CA3AF' },
            value: { color: '#F3F4F6' },
            total: {
              show: true,
              color: '#9CA3AF',
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
</script>

<template>
  <div class="max-w-7xl mx-auto py-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-df-text mb-2">Dashboard</h1>
        <p class="text-df-text-muted">Overview of your support performance.</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="glass-panel px-4 py-2 rounded-lg flex items-center gap-2">
          <FilterIcon class="w-4 h-4 text-df-text-muted" />
          <select v-model="daysFilter" class="bg-transparent text-df-text text-sm focus:outline-none cursor-pointer">
            <option :value="7">Last 7 Days</option>
            <option :value="15">Last 15 Days</option>
            <option :value="30">Last 30 Days</option>
            <option :value="undefined">All Time</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="p-12 text-center text-df-text-muted">
      Loading metrics...
    </div>

    <template v-else-if="stats">
      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <ActivityIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-df-text-muted mb-1">Total Tickets</p>
          <h3 class="text-3xl font-bold text-df-text">{{ stats.overview.totalTickets }}</h3>
        </div>

        <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-orange-500/20 text-orange-400 rounded-xl">
              <ClockIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-df-text-muted mb-1">Open Tickets</p>
          <h3 class="text-3xl font-bold text-df-text">{{ stats.overview.openTickets }}</h3>
        </div>

        <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-green-500/20 text-green-400 rounded-xl">
              <CheckCircleIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-df-text-muted mb-1">Resolved Tickets</p>
          <h3 class="text-3xl font-bold text-df-text">{{ stats.overview.resolvedTickets }}</h3>
        </div>

        <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-red-500/20 text-red-400 rounded-xl">
              <AlertCircleIcon class="w-6 h-6" />
            </div>
          </div>
          <p class="text-sm font-medium text-df-text-muted mb-1">SLA Breached</p>
          <h3 class="text-3xl font-bold text-df-text">{{ stats.overview.breachedSla }}</h3>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 class="text-lg font-medium text-df-text mb-6">Ticket Volume</h3>
          <apexchart type="area" height="350" :options="timelineOptions" :series="timelineSeries"></apexchart>
        </div>
        <div class="glass-panel p-6 rounded-2xl">
          <h3 class="text-lg font-medium text-df-text mb-6">Tickets by Status</h3>
          <div class="flex justify-center items-center h-[350px]">
            <apexchart type="donut" width="100%" :options="statusOptions" :series="statusSeries"></apexchart>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Fix select dropdown styles in dark mode */
select option {
  background-color: #1a1a1a;
  color: #fff;
}
</style>
