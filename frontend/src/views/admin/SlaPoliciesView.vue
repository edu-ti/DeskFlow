<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-gray-900">Políticas de SLA</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Nível de Serviço & Calendários
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Configure os calendários comerciais (Padrão 8h-18h / Estendido 8h-21h) e os prazos em horas úteis para resposta, resolução e atendimento presencial.</p>
      </div>
      <button 
        @click="openModal()" 
        class="inline-flex items-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
      >
        <PlusIcon class="w-4 h-4" />
        Nova Política
      </button>
    </div>

    <!-- Lista de Políticas -->
    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
        <span class="text-sm font-medium">Carregando políticas de SLA...</span>
      </div>
      
      <div v-else-if="policies.length === 0" class="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
        <div class="p-4 bg-purple-50 text-purple-600 rounded-2xl mb-4">
          <ClockIcon class="w-10 h-10" />
        </div>
        <h3 class="text-lg font-bold text-gray-900">Nenhuma política configurada</h3>
        <p class="text-gray-500 text-sm mt-1.5 max-w-md">Crie políticas personalizadas de SLA para garantir que os prazos de atendimento aos clientes sejam cumpridos rigorosamente em horas úteis.</p>
        <button 
          @click="openModal()" 
          class="mt-6 inline-flex items-center gap-2 bg-df-primary text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-df-primary-hover shadow-sm"
        >
          <PlusIcon class="w-4 h-4" />
          Criar Primeira Política
        </button>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/80 border-b border-gray-200/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="py-3.5 px-6">Nome da Política</th>
              <th class="py-3.5 px-6">Calendário</th>
              <th class="py-3.5 px-6">Prioridade</th>
              <th class="py-3.5 px-6">Grupo / Setor</th>
              <th class="py-3.5 px-6">1ª Resposta</th>
              <th class="py-3.5 px-6">Resolução Remota</th>
              <th class="py-3.5 px-6">Presencial</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="policy in policies" :key="policy.id" class="hover:bg-gray-50/80 transition-colors">
              <td class="py-4 px-6">
                <div class="font-bold text-gray-900">{{ policy.name }}</div>
              </td>
              <td class="py-4 px-6">
                <span v-if="policy.calendar_type === 'extended_8_21'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <SunIcon class="w-3.5 h-3.5" />
                  Estendido (Dom-Dom 08h-21h)
                </span>
                <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <BriefcaseIcon class="w-3.5 h-3.5" />
                  Padrão (Seg-Sex 08h-18h)
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold" :class="getPriorityBadge(policy.priority_id)">
                  {{ getPriorityName(policy.priority_id) }}
                </span>
              </td>
              <td class="py-4 px-6 text-sm text-gray-600 font-medium">
                {{ getGroupName(policy.group_id) }}
              </td>
              <td class="py-4 px-6">
                <span class="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {{ formatMinutes(policy.first_response_mins) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="font-mono text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  {{ formatMinutes(policy.resolution_mins) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {{ formatMinutes(policy.onsite_resolution_mins || 480) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  policy.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                ]">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="policy.is_active ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ policy.is_active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right space-x-2">
                <button @click="openModal(policy)" class="text-gray-600 hover:text-df-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                  <EditIcon class="w-4 h-4" />
                </button>
                <button @click="deletePolicy(policy.id)" class="text-gray-600 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Criação / Edição -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        <form @submit.prevent="savePolicy">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ form.id ? 'Editar Política de SLA' : 'Nova Política de SLA' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Defina o calendário e os prazos em horas úteis</p>
            </div>
            <button @click="closeModal" type="button" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
              <XIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nome da Política *</label>
              <input v-model="form.name" type="text" required placeholder="Ex: SLA Padrão Suporte VIP" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none">
            </div>

            <!-- Calendário Comercial -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Calendário de Atendimento *</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="border rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-1" :class="form.calendar_type === 'standard_8_18' ? 'border-df-primary bg-blue-50/40 text-df-primary ring-2 ring-df-primary/20' : 'border-gray-200 hover:bg-gray-50'">
                  <div class="flex items-center gap-2">
                    <input type="radio" value="standard_8_18" v-model="form.calendar_type" class="text-df-primary focus:ring-df-primary" />
                    <span class="text-xs font-bold text-gray-900">Horário Padrão</span>
                  </div>
                  <span class="text-[11px] text-gray-500">Seg a Sex, 08h às 18h (Pausa nos fins de semana)</span>
                </label>

                <label class="border rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-1" :class="form.calendar_type === 'extended_8_21' ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20' : 'border-gray-200 hover:bg-gray-50'">
                  <div class="flex items-center gap-2">
                    <input type="radio" value="extended_8_21" v-model="form.calendar_type" class="text-amber-600 focus:ring-amber-500" />
                    <span class="text-xs font-bold text-gray-900">Horário Estendido</span>
                  </div>
                  <span class="text-[11px] text-gray-500">Dom a Dom, 08h às 21h (7 dias/semana)</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Prioridade</label>
                <select v-model="form.priority_id" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none bg-white">
                  <option :value="null">Qualquer Prioridade</option>
                  <option :value="1">1 - Baixa</option>
                  <option :value="2">2 - Média</option>
                  <option :value="3">3 - Alta</option>
                  <option :value="4">4 - Urgente</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Grupo / Setor</label>
                <select v-model="form.group_id" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none bg-white">
                  <option :value="null">Qualquer Grupo</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
                </select>
              </div>
            </div>

            <!-- Prazos em Horas Úteis -->
            <div class="space-y-3 pt-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-700">Prazos em Minutos Úteis</span>
                <div class="flex gap-1.5">
                  <button type="button" @click="applyPreset(60, 240, 480)" class="text-[11px] font-semibold text-df-primary hover:underline">
                    Usar Padrão (1h / 4h / 8h)
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-gray-600 mb-1">1ª Resposta</label>
                  <input v-model.number="form.first_response_mins" type="number" required min="1" placeholder="60 (1h)" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none font-mono">
                  <span class="text-[10px] text-gray-400 mt-0.5 block">{{ formatMinutes(form.first_response_mins) }}</span>
                </div>

                <div>
                  <label class="block text-[11px] font-medium text-gray-600 mb-1">Resolução Remota</label>
                  <input v-model.number="form.resolution_mins" type="number" required min="1" placeholder="240 (4h)" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none font-mono">
                  <span class="text-[10px] text-gray-400 mt-0.5 block">{{ formatMinutes(form.resolution_mins) }}</span>
                </div>

                <div>
                  <label class="block text-[11px] font-medium text-gray-600 mb-1">Presencial (Visita)</label>
                  <input v-model.number="form.onsite_resolution_mins" type="number" required min="1" placeholder="480 (8h)" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none font-mono">
                  <span class="text-[10px] text-gray-400 mt-0.5 block">{{ formatMinutes(form.onsite_resolution_mins) }}</span>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.is_active" type="checkbox" class="w-4 h-4 text-df-primary rounded border-gray-300 focus:ring-df-primary">
                <span class="text-sm font-medium text-gray-700">Política ativa para novos chamados</span>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-100 flex justify-end gap-2.5 bg-gray-50">
            <button @click="closeModal" type="button" class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" class="px-4 py-2 bg-df-primary text-white text-sm font-semibold rounded-xl hover:bg-df-primary-hover flex items-center gap-2 disabled:opacity-50" :disabled="isSaving">
              <Loader2Icon v-if="isSaving" class="w-4 h-4 animate-spin" />
              <span>Salvar Política</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon, EditIcon, TrashIcon, ClockIcon, XIcon, Loader2Icon, SunIcon, BriefcaseIcon } from 'lucide-vue-next';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const { success: toastSuccess, error: toastError } = useToast();
const { confirm: dialogConfirm } = useConfirm();

const policies = ref<any[]>([]);
const groups = ref<any[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const showModal = ref(false);

const form = ref<any>({
  id: null,
  name: '',
  calendar_type: 'standard_8_18',
  priority_id: null,
  group_id: null,
  first_response_mins: 60,
  resolution_mins: 240,
  onsite_resolution_mins: 480,
  is_active: true,
});

onMounted(async () => {
  await Promise.all([loadPolicies(), loadGroups()]);
});

const loadPolicies = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/sla-policies');
    policies.value = res.data;
  } catch (error) {
    toastError('Erro', 'Falha ao carregar políticas de SLA.');
  } finally {
    isLoading.value = false;
  }
};

const loadGroups = async () => {
  try {
    const res = await api.get('/groups');
    groups.value = res.data;
  } catch (error) {
    console.error('Falha ao carregar grupos', error);
  }
};

const applyPreset = (fr: number, res: number, onsite: number) => {
  form.value.first_response_mins = fr;
  form.value.resolution_mins = res;
  form.value.onsite_resolution_mins = onsite;
};

const openModal = (policy?: any) => {
  if (policy) {
    form.value = {
      ...policy,
      calendar_type: policy.calendar_type || 'standard_8_18',
      onsite_resolution_mins: policy.onsite_resolution_mins || 480,
    };
  } else {
    form.value = {
      id: null,
      name: '',
      calendar_type: 'standard_8_18',
      priority_id: null,
      group_id: null,
      first_response_mins: 60,
      resolution_mins: 240,
      onsite_resolution_mins: 480,
      is_active: true,
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const savePolicy = async () => {
  try {
    isSaving.value = true;
    if (form.value.id) {
      await api.put(`/sla-policies/${form.value.id}`, form.value);
      toastSuccess('Sucesso', 'Política de SLA atualizada com sucesso.');
    } else {
      await api.post('/sla-policies', form.value);
      toastSuccess('Sucesso', 'Política de SLA criada com sucesso.');
    }
    await loadPolicies();
    closeModal();
  } catch (error) {
    toastError('Erro', 'Falha ao salvar política de SLA.');
  } finally {
    isSaving.value = false;
  }
};

const deletePolicy = async (id: number) => {
  const ok = await dialogConfirm({
    title: 'Excluir Política de SLA',
    message: 'Deseja realmente excluir esta política de SLA? Os chamados existentes manterão os prazos já escalados.',
    type: 'danger',
    confirmText: 'Sim, Excluir',
    cancelText: 'Cancelar',
  });
  if (!ok) return;

  try {
    await api.delete(`/sla-policies/${id}`);
    toastSuccess('Sucesso', 'Política de SLA excluída com sucesso.');
    await loadPolicies();
  } catch (error) {
    toastError('Erro', 'Falha ao excluir política de SLA.');
  }
};

const getPriorityName = (id: number | null) => {
  switch (id) {
    case 1: return 'Baixa';
    case 2: return 'Média';
    case 3: return 'Alta';
    case 4: return 'Urgente';
    default: return 'Todas';
  }
};

const getPriorityBadge = (id: number | null) => {
  switch (id) {
    case 1: return 'bg-gray-100 text-gray-700';
    case 2: return 'bg-blue-100 text-blue-800';
    case 3: return 'bg-amber-100 text-amber-800';
    case 4: return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getGroupName = (id: number | null) => {
  if (!id) return 'Todos os Grupos';
  const g = groups.value.find(group => group.id === id);
  return g ? g.name : `Grupo #${id}`;
};

const formatMinutes = (mins: number) => {
  if (!mins) return 'N/A';
  if (mins < 60) return `${mins} min`;
  const hours = mins / 60;
  if (hours < 24) return `${hours}h úteis`;
  const days = (hours / 24).toFixed(1).replace('.0', '');
  return `${days}d (${hours}h úteis)`;
};
</script>
