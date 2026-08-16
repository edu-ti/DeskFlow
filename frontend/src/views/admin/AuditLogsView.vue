<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-gray-900">Auditoria & Conformidade LGPD</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Segurança & Governança
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Rastreabilidade completa de ações de operadores e gestão dos direitos dos titulares de dados.</p>
      </div>

      <div class="flex items-center gap-2.5">
        <button 
          v-if="activeTab === 'logs'"
          @click="exportCsv"
          class="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200/80 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs active:scale-95"
        >
          <DownloadIcon class="w-4 h-4 text-gray-500" />
          Exportar CSV
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-gray-200 gap-6">
      <button 
        @click="activeTab = 'logs'"
        class="pb-3 text-sm font-semibold transition-colors relative"
        :class="activeTab === 'logs' ? 'text-df-primary border-b-2 border-df-primary' : 'text-gray-500 hover:text-gray-800'"
      >
        <div class="flex items-center gap-2">
          <ShieldAlertIcon class="w-4 h-4" />
          <span>Trilha de Auditoria (Logs)</span>
        </div>
      </button>

      <button 
        @click="activeTab = 'lgpd'"
        class="pb-3 text-sm font-semibold transition-colors relative"
        :class="activeTab === 'lgpd' ? 'text-df-primary border-b-2 border-df-primary' : 'text-gray-500 hover:text-gray-800'"
      >
        <div class="flex items-center gap-2">
          <UserCheckIcon class="w-4 h-4" />
          <span>Direitos do Titular (LGPD)</span>
        </div>
      </button>
    </div>

    <!-- TAB 1: Trilha de Auditoria -->
    <div v-if="activeTab === 'logs'" class="space-y-4 animate-in fade-in duration-150">
      <!-- Filtros -->
      <div class="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Buscar no Log</label>
          <div class="relative">
            <SearchIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model="filters.search" 
              @input="debounceSearch"
              type="text" 
              placeholder="Ação, operador, descrição..." 
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Tipo de Ação</label>
          <select 
            v-model="filters.action" 
            @change="loadLogs"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Todas as Ações</option>
            <option value="TICKET_CREATE">Criação de Chamado</option>
            <option value="TICKET_UPDATE">Edição de Chamado</option>
            <option value="TICKET_DELETE">Exclusão de Chamado</option>
            <option value="USER_ANONYMIZE">Anonimização LGPD</option>
            <option value="SETTINGS_CHANGE">Alteração de Configuração</option>
            <option value="LOGIN">Login no Sistema</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Entidade</label>
          <select 
            v-model="filters.entity_type" 
            @change="loadLogs"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Todas as Entidades</option>
            <option value="ticket">Chamados</option>
            <option value="user">Usuários</option>
            <option value="setting">Configurações</option>
            <option value="auth">Autenticação</option>
          </select>
        </div>

        <div class="flex items-end">
          <button 
            @click="clearFilters"
            class="w-full py-2 px-3 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <!-- Tabela de Logs -->
      <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
        <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
          <span class="text-sm font-medium">Carregando trilha de auditoria...</span>
        </div>

        <div v-else-if="logs.length === 0" class="p-16 text-center text-gray-500 flex flex-col items-center">
          <div class="p-4 bg-gray-100 text-gray-400 rounded-2xl mb-4">
            <ShieldAlertIcon class="w-10 h-10" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Nenhum evento registrado</h3>
          <p class="text-xs text-gray-400 mt-1 max-w-sm">Os eventos de auditoria aparecerão aqui automaticamente conforme os operadores utilizarem o sistema.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 border-b border-gray-200/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th class="py-3.5 px-6">Data / Hora</th>
                <th class="py-3.5 px-6">Operador</th>
                <th class="py-3.5 px-6">Ação</th>
                <th class="py-3.5 px-6">Entidade / ID</th>
                <th class="py-3.5 px-6">Descrição</th>
                <th class="py-3.5 px-6">IP</th>
                <th class="py-3.5 px-6 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-xs">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50/80 transition-colors">
                <td class="py-4 px-6 whitespace-nowrap text-gray-600 font-mono">
                  {{ formatDate(log.created_at) }}
                </td>
                <td class="py-4 px-6">
                  <div class="font-bold text-gray-900">{{ log.user ? log.user.firstname + ' ' + (log.user.lastname || '') : 'Sistema' }}</div>
                  <div class="text-gray-400 text-[11px]">{{ log.user?.email || 'automático' }}</div>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold" :class="getActionBadge(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td class="py-4 px-6 text-gray-700 font-medium">
                  <span v-if="log.entity_type" class="uppercase font-semibold text-[10px] text-gray-400 block">{{ log.entity_type }}</span>
                  <span>{{ log.entity_id ? '#' + log.entity_id : 'N/A' }}</span>
                </td>
                <td class="py-4 px-6 text-gray-600 max-w-xs truncate" :title="log.description">
                  {{ log.description || '-' }}
                </td>
                <td class="py-4 px-6 font-mono text-gray-400 text-[11px]">
                  {{ log.ip_address || '127.0.0.1' }}
                </td>
                <td class="py-4 px-6 text-right">
                  <button 
                    v-if="log.old_values || log.new_values"
                    @click="openDetails(log)"
                    class="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ver Diff</span>
                    <ExternalLinkIcon class="w-3 h-3" />
                  </button>
                  <span v-else class="text-gray-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginação -->
        <div v-if="totalPages > 1" class="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span class="text-xs text-gray-500 font-medium">
            Página <strong class="text-gray-800">{{ page }}</strong> de <strong class="text-gray-800">{{ totalPages }}</strong> ({{ totalLogs }} registros)
          </span>
          <div class="flex gap-2">
            <button 
              @click="changePage(page - 1)" 
              :disabled="page <= 1"
              class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <button 
              @click="changePage(page + 1)" 
              :disabled="page >= totalPages"
              class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Conformidade LGPD -->
    <div v-else class="space-y-6 animate-in fade-in duration-150">
      <div class="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-blue-200/80 shadow-xs flex items-start gap-4">
        <div class="p-3 bg-blue-600 text-white rounded-xl shrink-0 shadow-xs">
          <ShieldCheckIcon class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-bold text-gray-900">Portal de Atendimento aos Direitos do Titular (LGPD)</h3>
          <p class="text-xs text-gray-600 mt-1 leading-relaxed max-w-3xl">
            Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), o titular possui direito de <strong>Portabilidade de Dados</strong> (exportação de todo o histórico cadastral e atendimentos) e <strong>Direito ao Esquecimento / Anonimização</strong> de dados pessoais, mantendo a integridade referencial do sistema.
          </p>
        </div>
      </div>

      <!-- Titular Lookup -->
      <div class="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <h4 class="text-sm font-bold text-gray-900">Localizar Titular para Ação de Privacidade</h4>
        
        <div class="flex gap-3">
          <div class="relative flex-1">
            <SearchIcon class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model="userSearchQuery" 
              @keydown.enter="searchTitular"
              type="text" 
              placeholder="Digite o e-mail ou nome do cliente titular..." 
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
          </div>
          <button 
            @click="searchTitular" 
            :disabled="isSearchingTitular"
            class="px-5 py-2.5 bg-df-primary hover:bg-df-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Loader2Icon v-if="isSearchingTitular" class="w-4 h-4 animate-spin" />
            <span v-else>Pesquisar</span>
          </button>
        </div>

        <!-- Titular Search Results -->
        <div v-if="foundUsers.length > 0" class="mt-4 border border-gray-100 rounded-xl divide-y divide-gray-100">
          <div 
            v-for="u in foundUsers" 
            :key="u.id" 
            class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {{ (u.firstname?.[0] || 'U') + (u.lastname?.[0] || '') }}
              </div>
              <div>
                <h5 class="text-sm font-bold text-gray-900">{{ u.firstname }} {{ u.lastname }}</h5>
                <p class="text-xs text-gray-500">{{ u.email }} • Tel: {{ u.phone || 'N/A' }} • ID #{{ u.id }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="exportUserDossier(u.id)" 
                class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                title="Exportar dossiê completo de dados em formato JSON"
              >
                <DownloadIcon class="w-3.5 h-3.5" />
                <span>Exportar Dossiê (Portabilidade)</span>
              </button>

              <button 
                @click="confirmAnonymization(u)" 
                class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                title="Anonimizar dados pessoais conforme LGPD"
              >
                <UserXIcon class="w-3.5 h-3.5" />
                <span>Anonimizar Titular</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Diff / Detalhes de Log -->
    <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-xs p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 class="text-base font-bold text-gray-900">Auditoria de Alterações (Diff)</h3>
            <p class="text-xs text-gray-500 mt-0.5">Evento #{{ selectedLog.id }} • {{ selectedLog.action }}</p>
          </div>
          <button @click="selectedLog = null" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs font-mono">
          <div v-if="selectedLog.old_values" class="space-y-1">
            <span class="font-bold text-red-700 uppercase">Valores Anteriores (Before):</span>
            <pre class="bg-red-50/50 border border-red-200 text-red-900 p-3 rounded-xl overflow-x-auto">{{ JSON.stringify(selectedLog.old_values, null, 2) }}</pre>
          </div>

          <div v-if="selectedLog.new_values" class="space-y-1">
            <span class="font-bold text-emerald-700 uppercase">Valores Novos (After):</span>
            <pre class="bg-emerald-50/50 border border-emerald-200 text-emerald-900 p-3 rounded-xl overflow-x-auto">{{ JSON.stringify(selectedLog.new_values, null, 2) }}</pre>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <button @click="selectedLog = null" class="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Anonimização (LGPD) -->
    <div v-if="anonymizeTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-xs p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 text-center">
          <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1">Confirmar Anonimização LGPD</h3>
          <p class="text-xs text-gray-600 mb-4 leading-relaxed">
            Esta ação é <strong>irreversível</strong>. Todos os dados de identificação pessoal de <strong>{{ anonymizeTarget.firstname }} {{ anonymizeTarget.lastname }}</strong> ({{ anonymizeTarget.email }}) serão substituídos por identificadores anônimos.
          </p>

          <div class="text-left bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
            <label class="block text-[11px] font-bold text-gray-700 mb-1">Para confirmar, digite <strong class="text-red-600 font-mono">ANONIMIZAR</strong>:</label>
            <input 
              v-model="anonymizeConfirmText" 
              type="text" 
              placeholder="ANONIMIZAR" 
              class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono"
            >
          </div>

          <div class="flex gap-2 justify-end">
            <button @click="anonymizeTarget = null" class="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button 
              @click="executeAnonymization" 
              :disabled="anonymizeConfirmText !== 'ANONIMIZAR' || isExecutingAnon"
              class="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="isExecutingAnon" class="w-3.5 h-3.5 animate-spin" />
              <span>Confirmar Anonimização</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  ShieldAlert as ShieldAlertIcon, 
  UserCheck as UserCheckIcon, 
  Search as SearchIcon, 
  Download as DownloadIcon, 
  Loader2 as Loader2Icon, 
  ExternalLink as ExternalLinkIcon, 
  ShieldCheck as ShieldCheckIcon, 
  UserX as UserXIcon, 
  X as XIcon, 
  AlertTriangle as AlertTriangleIcon 
} from 'lucide-vue-next';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const { success: toastSuccess, error: toastError } = useToast();

const activeTab = ref<'logs' | 'lgpd'>('logs');
const isLoading = ref(true);
const logs = ref<any[]>([]);
const totalLogs = ref(0);
const page = ref(1);
const totalPages = ref(1);

const filters = ref({
  search: '',
  action: '',
  entity_type: '',
});

let debounceTimer: any = null;

const userSearchQuery = ref('');
const isSearchingTitular = ref(false);
const foundUsers = ref<any[]>([]);

const selectedLog = ref<any>(null);
const anonymizeTarget = ref<any>(null);
const anonymizeConfirmText = ref('');
const isExecutingAnon = ref(false);

onMounted(async () => {
  await loadLogs();
});

const loadLogs = async () => {
  isLoading.value = true;
  try {
    const params: any = {
      page: page.value,
      limit: 20,
    };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.entity_type) params.entity_type = filters.value.entity_type;

    const res = await api.get('/audit-logs', { params });
    logs.value = res.data.items;
    totalLogs.value = res.data.total;
    totalPages.value = res.data.totalPages;
  } catch (err) {
    toastError('Erro', 'Falha ao carregar trilha de auditoria.');
  } finally {
    isLoading.value = false;
  }
};

const debounceSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    loadLogs();
  }, 300);
};

const clearFilters = () => {
  filters.value = { search: '', action: '', entity_type: '' };
  page.value = 1;
  loadLogs();
};

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    page.value = newPage;
    loadLogs();
  }
};

const exportCsv = async () => {
  try {
    const res = await api.get('/audit-logs/export-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trilha_auditoria_deskflow.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toastSuccess('Download concluído', 'Arquivo CSV gerado com sucesso.');
  } catch (err) {
    toastError('Erro', 'Não foi possível exportar a trilha de auditoria.');
  }
};

const searchTitular = async () => {
  if (!userSearchQuery.value.trim()) return;
  isSearchingTitular.value = true;
  try {
    const res = await api.get('/users');
    const q = userSearchQuery.value.toLowerCase();
    foundUsers.value = res.data.filter((u: any) => 
      (u.firstname && u.firstname.toLowerCase().includes(q)) ||
      (u.lastname && u.lastname.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
    if (foundUsers.value.length === 0) {
      toastError('Não encontrado', 'Nenhum titular localizado com o termo informado.');
    }
  } catch (err) {
    toastError('Erro', 'Falha ao pesquisar titulares.');
  } finally {
    isSearchingTitular.value = false;
  }
};

const exportUserDossier = async (userId: number) => {
  try {
    const res = await api.get(`/audit-logs/export-user-data/${userId}`);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dossie_lgpd_titular_${userId}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toastSuccess('Portabilidade LGPD', 'Dossiê estruturado do titular exportado com sucesso.');
  } catch (err) {
    toastError('Erro', 'Falha ao exportar dossiê do titular.');
  }
};

const confirmAnonymization = (user: any) => {
  anonymizeTarget.value = user;
  anonymizeConfirmText.value = '';
};

const executeAnonymization = async () => {
  if (!anonymizeTarget.value) return;
  isExecutingAnon.value = true;
  try {
    await api.post(`/audit-logs/anonymize-user/${anonymizeTarget.value.id}`);
    toastSuccess('Sucesso', 'Titular anonimizado com sucesso conforme a LGPD.');
    anonymizeTarget.value = null;
    await searchTitular();
  } catch (err) {
    toastError('Erro', 'Falha ao anonimizar titular.');
  } finally {
    isExecutingAnon.value = false;
  }
};

const openDetails = (log: any) => {
  selectedLog.value = log;
};

const formatDate = (d: string) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleString('pt-BR');
};

const getActionBadge = (action: string) => {
  switch (action) {
    case 'TICKET_CREATE': return 'bg-blue-100 text-blue-800';
    case 'TICKET_UPDATE': return 'bg-amber-100 text-amber-800';
    case 'TICKET_DELETE': return 'bg-red-100 text-red-800';
    case 'USER_ANONYMIZE': return 'bg-purple-100 text-purple-800';
    case 'SETTINGS_CHANGE': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-700';
  }
};
</script>
