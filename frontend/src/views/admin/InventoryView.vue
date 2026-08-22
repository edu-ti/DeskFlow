<template>
  <div class="space-y-6 pb-12 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CpuIcon class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-gray-900">Inventário de Máquinas & RMM</h1>
            <p class="text-xs text-gray-500">Monitoramento de telemetria em tempo real e abertura automática inteligente de chamados</p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button 
          @click="openInstallModal"
          class="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <TerminalIcon class="w-4 h-4" />
          <span>Instalar Agente RMM</span>
        </button>

        <button 
          @click="openNewModal"
          class="flex items-center gap-1.5 px-3.5 py-2 bg-df-primary hover:bg-df-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Novo Dispositivo</span>
        </button>
      </div>
    </div>

    <!-- KPIs Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold text-gray-500">Total de Máquinas</span>
        <div class="flex items-baseline justify-between mt-2">
          <h3 class="text-2xl font-extrabold text-gray-900">{{ devices.length }}</h3>
          <div class="p-2 bg-blue-50 text-blue-600 rounded-xl"><ServerIcon class="w-4 h-4" /></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold text-gray-500">Online / Conectadas</span>
        <div class="flex items-baseline justify-between mt-2">
          <h3 class="text-2xl font-extrabold text-emerald-600">{{ onlineCount }}</h3>
          <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2Icon class="w-4 h-4" /></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold text-gray-500">Em Atenção</span>
        <div class="flex items-baseline justify-between mt-2">
          <h3 class="text-2xl font-extrabold text-amber-500">{{ warningCount }}</h3>
          <div class="p-2 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangleIcon class="w-4 h-4" /></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold text-gray-500">Estado Crítico</span>
        <div class="flex items-baseline justify-between mt-2">
          <h3 class="text-2xl font-extrabold text-red-600">{{ criticalCount }}</h3>
          <div class="p-2 bg-red-50 text-red-600 rounded-xl"><AlertOctagonIcon class="w-4 h-4" /></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold text-gray-500">Alertas Ativos</span>
        <div class="flex items-baseline justify-between mt-2">
          <h3 class="text-2xl font-extrabold text-purple-600">{{ activeAlertsCount }}</h3>
          <div class="p-2 bg-purple-50 text-purple-600 rounded-xl"><BellRingIcon class="w-4 h-4" /></div>
        </div>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
      <div class="flex-1 max-w-md relative">
        <SearchIcon class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        <input 
          v-model="searchQuery" 
          @input="fetchDevices"
          type="text" 
          placeholder="Pesquisar por Hostname, IP ou Sistema Operacional..." 
          class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-df-primary focus:ring-2 focus:ring-df-primary/20"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Organization Filter -->
        <select 
          v-model="selectedOrgId" 
          @change="fetchDevices"
          class="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-df-primary/20"
        >
          <option :value="null">Todas as Empresas</option>
          <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
        </select>

        <!-- Status Filter -->
        <select 
          v-model="selectedStatus" 
          @change="fetchDevices"
          class="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-df-primary/20"
        >
          <option value="">Todos os Status</option>
          <option value="online">Online</option>
          <option value="warning">Atenção</option>
          <option value="critical">Crítico</option>
          <option value="offline">Offline</option>
        </select>

        <button 
          @click="fetchDevices" 
          class="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors"
          title="Recarregar Telemetria"
        >
          <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </div>

    <!-- Devices Table -->
    <div class="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div v-if="isLoading" class="flex justify-center p-12">
        <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
      </div>

      <div v-else-if="devices.length === 0" class="text-center py-16 text-gray-400">
        <LaptopIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p class="font-medium text-sm">Nenhum dispositivo encontrado.</p>
        <p class="text-xs mt-1 text-gray-400">Instale o agente RMM em uma máquina para começar a coletar telemetria automaticamente.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider">
              <th class="py-3 px-4">Dispositivo</th>
              <th class="py-3 px-4">Empresa / Cliente</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4">Uso CPU</th>
              <th class="py-3 px-4">Uso RAM</th>
              <th class="py-3 px-4">Uso Disco</th>
              <th class="py-3 px-4">Último Heartbeat</th>
              <th class="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 font-medium">
            <tr v-for="d in devices" :key="d.id" class="hover:bg-gray-50/60 transition-colors">
              <!-- Name & OS -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                    <ServerIcon v-if="d.device_type === 'server'" class="w-4 h-4 text-purple-600" />
                    <LaptopIcon v-else class="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span class="font-bold text-gray-900 block">{{ d.name }}</span>
                    <span class="text-[11px] text-gray-400 block truncate max-w-[180px]">{{ d.os_name || d.ip_address || 'Agente DeskFlow' }}</span>
                  </div>
                </div>
              </td>

              <!-- Organization -->
              <td class="py-3 px-4">
                <span v-if="d.organization" class="font-semibold text-gray-800 flex items-center gap-1">
                  <Building2Icon class="w-3.5 h-3.5 text-gray-400" />
                  {{ d.organization.name }}
                </span>
                <span v-else class="text-gray-400">Não vinculada</span>
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-4 text-center">
                <span 
                  :class="getStatusBadgeClass(d.status)" 
                  class="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(d.status)"></span>
                  {{ getStatusLabel(d.status) }}
                </span>
              </td>

              <!-- CPU Meter -->
              <td class="py-3 px-4 min-w-[120px]">
                <div class="flex items-center justify-between text-[11px] mb-1 font-bold">
                  <span class="text-gray-600">CPU</span>
                  <span :class="getMetricColorText(d.cpu_usage_percent)">{{ d.cpu_usage_percent ?? 0 }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    :class="getMetricColorBar(d.cpu_usage_percent)" 
                    class="h-full rounded-full transition-all duration-500" 
                    :style="{ width: `${Math.min(100, d.cpu_usage_percent || 0)}%` }"
                  ></div>
                </div>
              </td>

              <!-- RAM Meter -->
              <td class="py-3 px-4 min-w-[120px]">
                <div class="flex items-center justify-between text-[11px] mb-1 font-bold">
                  <span class="text-gray-600">RAM</span>
                  <span :class="getMetricColorText(d.ram_usage_percent)">{{ d.ram_usage_percent ?? 0 }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    :class="getMetricColorBar(d.ram_usage_percent)" 
                    class="h-full rounded-full transition-all duration-500" 
                    :style="{ width: `${Math.min(100, d.ram_usage_percent || 0)}%` }"
                  ></div>
                </div>
              </td>

              <!-- Disk Meter -->
              <td class="py-3 px-4 min-w-[120px]">
                <div class="flex items-center justify-between text-[11px] mb-1 font-bold">
                  <span class="text-gray-600">Disco C:</span>
                  <span :class="getMetricColorText(d.disk_usage_percent)">{{ d.disk_usage_percent ?? 0 }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    :class="getMetricColorBar(d.disk_usage_percent)" 
                    class="h-full rounded-full transition-all duration-500" 
                    :style="{ width: `${Math.min(100, d.disk_usage_percent || 0)}%` }"
                  ></div>
                </div>
              </td>

              <!-- Last Heartbeat -->
              <td class="py-3 px-4 text-gray-500 text-[11px]">
                {{ d.last_heartbeat_at ? formatTimeAgo(d.last_heartbeat_at) : 'Sem sinal' }}
              </td>

              <!-- Actions -->
              <td class="py-3 px-4 text-right">
                <button 
                  @click="openDeviceDetails(d)" 
                  class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Detalhes
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Detalhes do Dispositivo & Alertas -->
    <div v-if="selectedDevice" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95">
        <div class="flex items-start justify-between border-b border-gray-100 pb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span :class="getStatusBadgeClass(selectedDevice.status)" class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border">
                {{ getStatusLabel(selectedDevice.status) }}
              </span>
              <span v-if="selectedDevice.organization" class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                {{ selectedDevice.organization.name }}
              </span>
            </div>
            <h2 class="text-lg font-extrabold text-gray-900">{{ selectedDevice.name }}</h2>
          </div>
          <button @click="selectedDevice = null" class="text-gray-400 hover:text-gray-600 p-1">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Hardware specs -->
          <div class="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <span class="text-gray-400 block text-[10px] uppercase font-bold">Sistema Operacional</span>
              <span class="font-bold text-gray-800">{{ selectedDevice.os_name || 'Windows / Linux' }}</span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase font-bold">Endereço IP / MAC</span>
              <span class="font-bold text-gray-800">{{ selectedDevice.ip_address || '—' }} ({{ selectedDevice.mac_address || '—' }})</span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase font-bold">Processador (CPU)</span>
              <span class="font-bold text-gray-800">{{ selectedDevice.cpu_model || '—' }}</span>
            </div>
            <div>
              <span class="text-gray-400 block text-[10px] uppercase font-bold">Memória RAM Instalada</span>
              <span class="font-bold text-gray-800">{{ selectedDevice.ram_total_gb ? `${selectedDevice.ram_total_gb} GB` : '—' }}</span>
            </div>
          </div>

          <!-- Alertas Ativos / Chamados Automáticos -->
          <div>
            <h3 class="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <AlertOctagonIcon class="w-4 h-4 text-red-500" />
              <span>Alertas do Dispositivo & Chamados Automáticos</span>
            </h3>
            
            <div v-if="deviceAlerts.length === 0" class="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-center font-medium">
              ✅ Nenhum alerta ativo. O dispositivo está operando normalmente.
            </div>

            <div v-else class="space-y-2 max-h-48 overflow-y-auto">
              <div 
                v-for="alert in deviceAlerts" 
                :key="alert.id"
                class="p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-start justify-between gap-3"
              >
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase">
                      {{ alert.severity }}
                    </span>
                    <span v-if="alert.ticket" class="text-df-primary font-bold text-[11px]">
                      Chamado Auto #{{ alert.ticket.id }}
                    </span>
                  </div>
                  <p class="text-gray-800 font-medium">{{ alert.message }}</p>
                  <span class="text-[10px] text-gray-400">{{ new Date(alert.created_at).toLocaleString('pt-BR') }}</span>
                </div>

                <button 
                  v-if="!alert.is_resolved"
                  @click="resolveAlert(alert.id)"
                  class="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold shrink-0 shadow-2xs"
                >
                  Resolver
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button 
            @click="deleteDevice(selectedDevice.id)" 
            class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
          >
            Remover Máquina
          </button>
          <button 
            @click="selectedDevice = null" 
            class="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Instalação do Agente RMM -->
    <div v-if="showInstallModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2">
            <TerminalIcon class="w-5 h-5 text-purple-600" />
            <h2 class="text-base font-extrabold text-gray-900">Instalar Agente RMM DeskFlow</h2>
          </div>
          <button @click="showInstallModal = false" class="text-gray-400 hover:text-gray-600 p-1">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <p class="text-gray-600">
            Execute o script abaixo no PowerShell (como Administrador) no computador ou servidor que deseja monitorar. O agente coletará CPU, RAM, Disco e abrirá chamados automaticamente quando houver anomalias críticas.
          </p>

          <div>
            <label class="block font-bold text-gray-700 mb-1">Vincular à Empresa / Organização:</label>
            <select 
              v-model="agentOrgId" 
              @change="fetchAgentScript"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
            >
              <option :value="undefined">Nenhuma (Genérico)</option>
              <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>

          <div class="relative">
            <pre class="bg-gray-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap select-all">{{ agentScript }}</pre>
            <button 
              @click="copyScript" 
              class="absolute top-2 right-2 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 border border-gray-700 shadow-xs"
            >
              <CopyIcon class="w-3.5 h-3.5" />
              <span>Copiar Script</span>
            </button>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button 
            @click="showInstallModal = false" 
            class="px-4 py-2 bg-df-primary hover:bg-df-primary-hover text-white font-bold rounded-xl text-xs shadow-xs"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Cpu as CpuIcon, 
  Server as ServerIcon, 
  Laptop as LaptopIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  AlertTriangle as AlertTriangleIcon, 
  AlertOctagon as AlertOctagonIcon, 
  BellRing as BellRingIcon, 
  Search as SearchIcon, 
  RefreshCw as RefreshCwIcon, 
  Plus as PlusIcon, 
  Terminal as TerminalIcon, 
  Building2 as Building2Icon, 
  X as XIcon, 
  Copy as CopyIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { rmmService, type Device, type DeviceAlert } from '@/services/rmmService'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { success: toastSuccess, error: toastError } = useToast()
const { confirm: dialogConfirm, prompt: dialogPrompt } = useConfirm()

const devices = ref<Device[]>([])
const organizations = ref<any[]>([])
const selectedOrgId = ref<number | null>(null)
const selectedStatus = ref<string>('')
const searchQuery = ref('')
const isLoading = ref(false)
const selectedDevice = ref<Device | null>(null)
const deviceAlerts = ref<DeviceAlert[]>([])

const showInstallModal = ref(false)
const agentOrgId = ref<number | undefined>(undefined)
const agentScript = ref('')

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length)
const warningCount = computed(() => devices.value.filter(d => d.status === 'warning').length)
const criticalCount = computed(() => devices.value.filter(d => d.status === 'critical').length)
const activeAlertsCount = computed(() => devices.value.filter(d => d.status === 'critical' || d.status === 'warning').length)

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    online: 'Online',
    warning: 'Atenção',
    critical: 'Crítico',
    offline: 'Offline',
  }
  return map[status] || status
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'online': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'critical': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'online': return 'bg-emerald-500';
    case 'warning': return 'bg-amber-500';
    case 'critical': return 'bg-red-500 animate-pulse';
    default: return 'bg-gray-400';
  }
}

const getMetricColorText = (percent: number | null | undefined) => {
  if (!percent) return 'text-gray-400';
  if (percent >= 90) return 'text-red-600';
  if (percent >= 80) return 'text-amber-600';
  return 'text-emerald-600';
}

const getMetricColorBar = (percent: number | null | undefined) => {
  if (!percent) return 'bg-gray-300';
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Agora mesmo'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Há ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Há ${diffHours}h`
  return date.toLocaleDateString('pt-BR')
}

const fetchDevices = async () => {
  isLoading.value = true
  try {
    devices.value = await rmmService.getDevices({
      organization_id: selectedOrgId.value || undefined,
      status: selectedStatus.value || undefined,
      search: searchQuery.value || undefined,
    })
  } catch (error) {
    console.error('Failed to fetch devices', error)
  } finally {
    isLoading.value = false
  }
}

const fetchOrganizations = async () => {
  try {
    const res = await api.get('/organizations')
    organizations.value = res.data
  } catch (error) {
    console.error('Failed to load organizations', error)
  }
}

const openDeviceDetails = async (device: Device) => {
  selectedDevice.value = device
  try {
    deviceAlerts.value = await rmmService.getAlerts({ device_id: device.id })
  } catch (error) {
    console.error('Failed to load alerts', error)
  }
}

const resolveAlert = async (alertId: number) => {
  try {
    await rmmService.resolveAlert(alertId)
    toastSuccess('Alerta Resolvido', 'Status do alerta atualizado com sucesso.')
    if (selectedDevice.value) {
      deviceAlerts.value = await rmmService.getAlerts({ device_id: selectedDevice.value.id })
    }
    await fetchDevices()
  } catch (error) {
    toastError('Erro', 'Falha ao resolver alerta.')
  }
}

const deleteDevice = async (id: number) => {
  const ok = await dialogConfirm({
    title: 'Remover Máquina',
    message: 'Tem certeza que deseja remover esta máquina do inventário? Os alertas e o histórico de telemetria serão mantidos.',
    type: 'danger',
    confirmText: 'Sim, Remover',
    cancelText: 'Cancelar',
  })
  if (!ok) return

  try {
    await rmmService.deleteDevice(id)
    toastSuccess('Sucesso', 'Máquina removida do inventário.')
    selectedDevice.value = null
    await fetchDevices()
  } catch (error) {
    toastError('Erro', 'Falha ao remover máquina.')
  }
}

const openInstallModal = async () => {
  await fetchAgentScript()
  showInstallModal.value = true
}

const fetchAgentScript = async () => {
  try {
    const res = await rmmService.getAgentScript(agentOrgId.value)
    agentScript.value = res.script
  } catch (error) {
    console.error('Failed to generate script', error)
  }
}

const copyScript = () => {
  navigator.clipboard.writeText(agentScript.value)
  toastSuccess('Copiado', 'Script do Agente RMM copiado para a área de transferência!')
}

const openNewModal = async () => {
  const name = await dialogPrompt({
    title: 'Novo Dispositivo',
    message: 'Digite o Hostname ou Nome da Máquina para cadastro no inventário:',
    placeholder: 'Ex: SRV-DATABASE-01 ou DESKTOP-FIN02',
    inputLabel: 'Hostname / Nome do Dispositivo',
    confirmText: 'Cadastrar Dispositivo',
    cancelText: 'Cancelar',
    required: true,
  })
  if (!name) return

  try {
    await rmmService.createDevice({ name, status: 'online' })
    toastSuccess('Sucesso', `Dispositivo ${name} cadastrado com sucesso!`)
    await fetchDevices()
  } catch (error) {
    toastError('Erro', 'Falha ao cadastrar dispositivo.')
  }
}

onMounted(() => {
  fetchOrganizations()
  fetchDevices()
})
</script>
