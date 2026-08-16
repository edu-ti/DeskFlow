<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-gray-900">Gatilhos e Automações</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Regras de Negócio
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Automatize ações, atribuição Round-Robin e mudanças de status orientadas a eventos.</p>
      </div>
      <button 
        @click="openModal()" 
        class="inline-flex items-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
      >
        <PlusIcon class="w-4 h-4" />
        Novo Gatilho
      </button>
    </div>

    <!-- Main Content List -->
    <div class="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
      <div v-if="isLoading" class="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
        <span class="text-sm font-medium">Carregando gatilhos...</span>
      </div>
      
      <div v-else-if="triggers.length === 0" class="p-16 text-center flex flex-col items-center justify-center">
        <div class="p-4 bg-blue-50 text-df-primary rounded-2xl mb-4">
          <ZapIcon class="w-10 h-10" />
        </div>
        <h3 class="text-lg font-bold text-gray-900">Nenhum gatilho configurado</h3>
        <p class="text-gray-500 text-sm mt-1.5 max-w-md">Os gatilhos automatizam ações baseadas em regras (ex: Round-Robin, escalonamento). Crie sua primeira regra para poupar tempo da equipe.</p>
        <button 
          @click="openModal()" 
          class="mt-6 inline-flex items-center gap-2 bg-df-primary text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-df-primary-hover shadow-sm"
        >
          <PlusIcon class="w-4 h-4" />
          Criar Primeiro Gatilho
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/80 border-b border-gray-200/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="py-3.5 px-6 w-12">#</th>
              <th class="py-3.5 px-6">Nome & Descrição</th>
              <th class="py-3.5 px-6">Evento Disparador</th>
              <th class="py-3.5 px-6">Regras / Ações</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="trigger in triggers" :key="trigger.id" class="hover:bg-gray-50/80 transition-colors">
              <td class="py-4 px-6 text-gray-400 text-xs font-mono">{{ trigger.id }}</td>
              <td class="py-4 px-6">
                <div class="font-bold text-gray-900">{{ trigger.name }}</div>
                <div class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ trigger.description || 'Sem descrição' }}</div>
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {{ trigger.event_type === 'ticket.created' ? 'Criação de Chamado' : 'Atualização de Chamado' }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="text-xs text-gray-600 font-medium">
                  {{ trigger.conditions?.length || 0 }} condições • {{ trigger.actions?.length || 0 }} ações
                </span>
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  trigger.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                ]">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="trigger.is_active ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ trigger.is_active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right space-x-2">
                <button @click="openModal(trigger)" class="text-gray-600 hover:text-df-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                  <EditIcon class="w-4 h-4" />
                </button>
                <button @click="confirmDelete(trigger)" class="text-gray-600 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Criação / Edição -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-xs p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 class="text-lg font-bold text-gray-900">{{ isEditing ? 'Editar Gatilho' : 'Novo Gatilho de Automação' }}</h3>
            <p class="text-xs text-gray-500 mt-0.5">Defina as condições que devem ser atendidas e as ações executadas</p>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <!-- Nome e Status -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nome do Gatilho *</label>
              <input v-model="currentTrigger.name" type="text" placeholder="Ex: Distribuir Suporte Round-Robin" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select v-model="currentTrigger.is_active" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                <option :value="true">Ativo</option>
                <option :value="false">Inativo</option>
              </select>
            </div>
          </div>

          <!-- Descrição & Evento -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
              <input v-model="currentTrigger.description" type="text" placeholder="Explique o propósito deste gatilho" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Momento de Disparo *</label>
              <select v-model="currentTrigger.event_type" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium">
                <option value="ticket.created">Na Criação do Chamado</option>
                <option value="ticket.updated">Na Atualização do Chamado</option>
              </select>
            </div>
          </div>

          <!-- Conditions Section -->
          <div class="border-t border-gray-100 pt-5">
            <div class="flex justify-between items-center mb-3">
              <div>
                <h4 class="text-sm font-bold text-gray-900">Condições (Se...)</h4>
                <p class="text-xs text-gray-500">Todas as condições abaixo devem ser atendidas (AND)</p>
              </div>
              <button @click="addCondition" type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-df-primary hover:text-df-primary-hover bg-blue-50 px-2.5 py-1 rounded-lg">
                <PlusIcon class="w-3.5 h-3.5" /> Adicionar Condição
              </button>
            </div>

            <div v-if="currentTrigger.conditions.length === 0" class="text-xs text-gray-500 bg-gray-50 p-3.5 rounded-xl text-center border border-dashed border-gray-200">
              Sem condições adicionais (executará para todos os chamados disparados pelo evento).
            </div>

            <div v-else class="space-y-2.5">
              <div v-for="(cond, index) in currentTrigger.conditions" :key="index" class="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <select v-model="cond.field" class="w-1/3 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium">
                  <option value="title">Título do Chamado</option>
                  <option value="source">Canal / Origem</option>
                  <option value="priority_id">Prioridade</option>
                  <option value="state_id">Status</option>
                  <option value="group_id">Grupo / Setor</option>
                </select>

                <select v-model="cond.operator" class="w-1/4 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium">
                  <option value="equals">É igual a</option>
                  <option value="not_equals">É diferente de</option>
                  <option value="contains">Contém o texto</option>
                </select>

                <input v-model="cond.value" type="text" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="Valor esperado...">

                <button @click="removeCondition(index)" type="button" class="text-gray-400 hover:text-red-500 p-1">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Actions Section -->
          <div class="border-t border-gray-100 pt-5">
            <div class="flex justify-between items-center mb-3">
              <div>
                <h4 class="text-sm font-bold text-gray-900">Ações (Então execute...)</h4>
                <p class="text-xs text-gray-500">Ações automáticas executadas quando as condições passarem</p>
              </div>
              <button @click="addAction" type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <PlusIcon class="w-3.5 h-3.5" /> Adicionar Ação
              </button>
            </div>

            <div v-if="currentTrigger.actions.length === 0" class="text-xs text-amber-700 bg-amber-50 p-3.5 rounded-xl text-center border border-dashed border-amber-200 font-medium">
              Defina pelo menos uma ação para o gatilho funcionar.
            </div>

            <div v-else class="space-y-2.5">
              <div v-for="(act, index) in currentTrigger.actions" :key="index" class="flex items-center gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-200">
                <select v-model="act.action" class="w-1/3 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium">
                  <option value="set_state">Definir Status</option>
                  <option value="set_priority">Definir Prioridade</option>
                  <option value="set_group">Transferir para Grupo</option>
                  <option value="set_owner">Atribuir a Atendente</option>
                  <option value="round_robin_assign">Distribuir Round-Robin</option>
                  <option value="send_notification">Enviar Alerta no Sistema</option>
                </select>

                <!-- Value Inputs baseados no tipo de ação -->
                <!-- State Selector -->
                <select v-if="act.action === 'set_state'" v-model="act.value" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
                  <option value="1">1 - Triagem / Novo</option>
                  <option value="2">2 - Aberto</option>
                  <option value="3">3 - Em Atendimento</option>
                  <option value="4">4 - Pendente (Aguardando Cliente)</option>
                  <option value="5">5 - Resolvido</option>
                  <option value="6">6 - Dúvida</option>
                </select>

                <!-- Priority Selector -->
                <select v-else-if="act.action === 'set_priority'" v-model="act.value" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
                  <option value="1">1 - Baixa</option>
                  <option value="2">2 - Média</option>
                  <option value="3">3 - Alta</option>
                  <option value="4">4 - Urgente</option>
                </select>

                <!-- Group Selector -->
                <select v-else-if="act.action === 'set_group' || act.action === 'round_robin_assign'" v-model="act.value" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
                  <option value="">Selecione o Grupo...</option>
                  <option v-for="g in groups" :key="g.id" :value="String(g.id)">{{ g.name }}</option>
                </select>

                <!-- Agent Selector -->
                <select v-else-if="act.action === 'set_owner'" v-model="act.value" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
                  <option value="">Selecione o Atendente...</option>
                  <option v-for="u in agents" :key="u.id" :value="String(u.id)">{{ u.firstname }} {{ u.lastname }} ({{ u.email }})</option>
                </select>

                <!-- Free text (Notification) -->
                <input v-else v-model="act.value" type="text" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white" placeholder="Mensagem do alerta...">

                <button @click="removeAction(index)" type="button" class="text-gray-400 hover:text-red-500 p-1">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 flex justify-end gap-2.5 bg-gray-50">
          <button @click="closeModal" type="button" class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
          <button @click="saveTrigger" type="button" class="px-4 py-2 bg-df-primary text-white text-sm font-semibold rounded-xl hover:bg-df-primary-hover flex items-center gap-2 disabled:opacity-50" :disabled="isSaving || !currentTrigger.name.trim()">
            <Loader2Icon v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>Salvar Gatilho</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon, EditIcon, TrashIcon, ZapIcon, XIcon, Loader2Icon } from 'lucide-vue-next';
import { triggerService, type Trigger } from '../../services/triggerService';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const { success: toastSuccess, error: toastError } = useToast();

const triggers = ref<Trigger[]>([]);
const groups = ref<any[]>([]);
const agents = ref<any[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);

const isModalOpen = ref(false);
const isEditing = ref(false);

const defaultTrigger: Trigger = {
  name: '',
  description: '',
  is_active: true,
  event_type: 'ticket.created',
  conditions: [],
  actions: []
};

const currentTrigger = ref<Trigger>(JSON.parse(JSON.stringify(defaultTrigger)));

onMounted(async () => {
  await Promise.all([loadTriggers(), loadAuxiliaryData()]);
});

const loadAuxiliaryData = async () => {
  try {
    const [groupsRes, usersRes] = await Promise.all([
      api.get('/groups'),
      api.get('/iam/users')
    ]);
    groups.value = groupsRes.data || [];
    agents.value = (usersRes.data || []).filter((u: any) => u.roles?.some((r: any) => r.name === 'agent' || r.name === 'admin'));
  } catch (err) {
    console.error('Failed to load auxiliary data', err);
  }
};

const loadTriggers = async () => {
  try {
    isLoading.value = true;
    triggers.value = await triggerService.getAll();
  } catch (error) {
    toastError('Erro', 'Não foi possível carregar os gatilhos.');
  } finally {
    isLoading.value = false;
  }
};

const openModal = (trigger?: Trigger) => {
  if (trigger) {
    isEditing.value = true;
    currentTrigger.value = JSON.parse(JSON.stringify({
      ...trigger,
      conditions: trigger.conditions || [],
      actions: trigger.actions || []
    }));
  } else {
    isEditing.value = false;
    currentTrigger.value = JSON.parse(JSON.stringify(defaultTrigger));
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const addCondition = () => {
  currentTrigger.value.conditions.push({
    field: 'title',
    operator: 'contains',
    value: ''
  });
};

const removeCondition = (index: number) => {
  currentTrigger.value.conditions.splice(index, 1);
};

const addAction = () => {
  currentTrigger.value.actions.push({
    action: 'set_state',
    value: '2'
  });
};

const removeAction = (index: number) => {
  currentTrigger.value.actions.splice(index, 1);
};

const saveTrigger = async () => {
  if (!currentTrigger.value.name) return;

  try {
    isSaving.value = true;
    if (isEditing.value && currentTrigger.value.id) {
      await triggerService.update(currentTrigger.value.id, currentTrigger.value);
      toastSuccess('Sucesso', 'Gatilho atualizado com sucesso.');
    } else {
      await triggerService.create(currentTrigger.value);
      toastSuccess('Sucesso', 'Gatilho criado com sucesso.');
    }
    await loadTriggers();
    closeModal();
  } catch (error) {
    toastError('Erro', 'Falha ao salvar o gatilho.');
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (trigger: Trigger) => {
  if (!trigger.id) return;
  if (confirm(`Deseja realmente excluir o gatilho "${trigger.name}"?`)) {
    try {
      await triggerService.delete(trigger.id);
      toastSuccess('Sucesso', 'Gatilho excluído com sucesso.');
      await loadTriggers();
    } catch (error) {
      toastError('Erro', 'Falha ao excluir o gatilho.');
    }
  }
};
</script>
