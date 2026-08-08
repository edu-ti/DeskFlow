<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gatilhos</h1>
        <p class="text-gray-500 text-sm mt-1">Configure automações baseadas em eventos (Criação e Atualização de Chamados)</p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <PlusIcon class="w-5 h-5" />
        Novo Gatilho
      </button>
    </div>

    <!-- Main Content List -->
    <div class="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div v-if="isLoading" class="p-8 text-center text-gray-500">
        Carregando gatilhos...
      </div>
      
      <div v-else-if="triggers.length === 0" class="p-12 text-center flex flex-col items-center justify-center h-full">
        <ZapIcon class="w-16 h-16 text-gray-300 mb-4" />
        <h3 class="text-lg font-medium text-gray-800">Nenhum gatilho configurado</h3>
        <p class="text-gray-500 mt-2 max-w-md">Os gatilhos automatizam ações baseadas em regras de negócio. Crie seu primeiro gatilho para poupar tempo.</p>
        <button 
          @click="openModal()" 
          class="mt-6 text-df-primary hover:text-df-primary-hover font-medium bg-df-primary/10 px-4 py-2 rounded-lg"
        >
          Criar Primeiro Gatilho
        </button>
      </div>

      <div v-else class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th class="py-3 px-6 font-semibold w-12">#</th>
              <th class="py-3 px-6 font-semibold">Nome</th>
              <th class="py-3 px-6 font-semibold">Evento</th>
              <th class="py-3 px-6 font-semibold">Status</th>
              <th class="py-3 px-6 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="trigger in triggers" :key="trigger.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6 text-gray-500 text-sm">{{ trigger.id }}</td>
              <td class="py-4 px-6">
                <div class="font-medium text-gray-800">{{ trigger.name }}</div>
                <div class="text-xs text-gray-500 mt-1 line-clamp-1">{{ trigger.description }}</div>
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {{ trigger.event_type === 'ticket.created' ? 'Criação de Chamado' : 'Atualização de Chamado' }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                  trigger.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                ]">
                  {{ trigger.is_active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <button @click="openModal(trigger)" class="text-blue-600 hover:text-blue-900 mx-2 p-1 rounded hover:bg-blue-50" title="Editar">
                  <EditIcon class="w-4 h-4" />
                </button>
                <button @click="confirmDelete(trigger)" class="text-red-600 hover:text-red-900 mx-2 p-1 rounded hover:bg-red-50" title="Excluir">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Trigger Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-10 pb-10 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col my-auto max-h-[90vh]">
        
        <div class="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">{{ isEditing ? 'Editar Gatilho' : 'Novo Gatilho' }}</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <XIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Gatilho *</label>
              <input 
                v-model="currentTrigger.name" 
                type="text" 
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-df-primary focus:border-df-primary" 
                placeholder="Ex: Definir prioridade para novos incidentes"
              >
            </div>
            
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea 
                v-model="currentTrigger.description" 
                rows="2"
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-df-primary focus:border-df-primary" 
                placeholder="Detalhes opcionais sobre quando este gatilho é executado"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Disparar Evento</label>
              <select v-model="currentTrigger.event_type" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-df-primary focus:border-df-primary bg-white">
                <option value="ticket.created">Criação de Chamado</option>
                <option value="ticket.updated">Atualização de Chamado</option>
              </select>
            </div>

            <div class="flex items-end pb-2">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" v-model="currentTrigger.is_active" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-df-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-df-primary"></div>
                <span class="ml-3 text-sm font-medium text-gray-700">Ativo</span>
              </label>
            </div>
          </div>

          <hr class="border-gray-200">

          <!-- Conditions Section -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Condições</h3>
                <p class="text-xs text-gray-500">O gatilho será executado quando TODAS as condições abaixo forem verdadeiras.</p>
              </div>
              <button @click="addCondition" class="text-sm text-df-primary hover:text-df-primary-hover font-medium flex items-center">
                <PlusIcon class="w-4 h-4 mr-1" /> Adicionar
              </button>
            </div>

            <div v-if="currentTrigger.conditions.length === 0" class="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center border border-dashed border-gray-300">
              Nenhuma condição definida. Este gatilho será executado em TODOS os eventos.
            </div>

            <div v-else class="space-y-3">
              <div v-for="(cond, index) in currentTrigger.conditions" :key="index" class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <select v-model="cond.field" class="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-df-primary focus:border-df-primary bg-white">
                  <option value="state_id">Status</option>
                  <option value="priority_id">Prioridade</option>
                  <option value="group_id">Grupo</option>
                  <option value="owner_id">Atendente</option>
                  <option value="subject">Assunto</option>
                  <option value="customer_id">Cliente</option>
                </select>
                
                <select v-model="cond.operator" class="w-1/4 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-df-primary focus:border-df-primary bg-white">
                  <option value="equals">É igual a</option>
                  <option value="not_equals">Não é igual a</option>
                  <option value="contains">Contém</option>
                  <option value="changed">Alterado</option>
                  <option value="changed_to">Alterado para</option>
                </select>

                <input v-if="!['changed'].includes(cond.operator)" v-model="cond.value" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-df-primary focus:border-df-primary" placeholder="Valor">
                <div v-else class="flex-1"></div>

                <button @click="removeCondition(index)" class="text-gray-400 hover:text-red-500 p-1">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <hr class="border-gray-200">

          <!-- Actions Section -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Ações</h3>
                <p class="text-xs text-gray-500">Estas ações serão executadas quando as condições passarem.</p>
              </div>
              <button @click="addAction" class="text-sm text-df-primary hover:text-df-primary-hover font-medium flex items-center">
                <PlusIcon class="w-4 h-4 mr-1" /> Adicionar
              </button>
            </div>

            <div v-if="currentTrigger.actions.length === 0" class="text-sm text-red-500 bg-red-50 p-4 rounded-lg text-center border border-dashed border-red-200">
              Você deve definir pelo menos uma ação para o gatilho funcionar.
            </div>

            <div v-else class="space-y-3">
              <div v-for="(act, index) in currentTrigger.actions" :key="index" class="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <select v-model="act.action" class="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-df-primary focus:border-df-primary bg-white">
                  <option value="set_state">Definir Status como</option>
                  <option value="set_priority">Definir Prioridade como</option>
                  <option value="set_group">Atribuir ao Grupo</option>
                  <option value="set_owner">Atribuir ao Atendente</option>
                </select>
                
                <input v-model="act.value" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-df-primary focus:border-df-primary" placeholder="ID (ex: 2 para Suporte)">

                <button @click="removeAction(index)" class="text-gray-400 hover:text-red-500 p-1">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button @click="closeModal" class="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Cancelar
          </button>
          <button @click="saveTrigger" class="px-5 py-2 bg-df-primary text-white rounded-lg hover:bg-df-primary-hover font-medium flex items-center" :disabled="isSaving">
            <Loader2Icon v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            Salvar Gatilho
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
import { useNotificationsStore } from '../../stores/notificationsStore';

const triggers = ref<Trigger[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const notifications = useNotificationsStore();

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
  await loadTriggers();
});

const loadTriggers = async () => {
  try {
    isLoading.value = true;
    triggers.value = await triggerService.getAll();
  } catch (error) {
    console.error('Failed to load triggers', error);
  } finally {
    isLoading.value = false;
  }
};

const openModal = (trigger?: Trigger) => {
  if (trigger) {
    isEditing.value = true;
    // ensure conditions and actions exist
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
  currentTrigger.value.conditions.push({ field: 'priority_id', operator: 'equals', value: '' });
};

const removeCondition = (index: number) => {
  currentTrigger.value.conditions.splice(index, 1);
};

const addAction = () => {
  currentTrigger.value.actions.push({ action: 'set_priority', value: '' });
};

const removeAction = (index: number) => {
  currentTrigger.value.actions.splice(index, 1);
};

const saveTrigger = async () => {
  if (!currentTrigger.value.name || currentTrigger.value.actions.length === 0) {
    alert("Por favor, preencha o nome e adicione pelo menos uma ação.");
    return;
  }

  try {
    isSaving.value = true;
    if (isEditing.value && currentTrigger.value.id) {
      await triggerService.update(currentTrigger.value.id, currentTrigger.value);
      notifications.showToast('Gatilho atualizado com sucesso!', 'success');
    } else {
      await triggerService.create(currentTrigger.value);
      notifications.showToast('Gatilho criado com sucesso!', 'success');
    }
    closeModal();
    await loadTriggers();
  } catch (error) {
    console.error("Failed to save trigger", error);
    notifications.showToast('Erro ao salvar gatilho', 'error');
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (trigger: Trigger) => {
  if (confirm(`Tem certeza que deseja excluir o gatilho "${trigger.name}"?`)) {
    try {
      if (trigger.id) {
        await triggerService.delete(trigger.id);
        notifications.showToast('Gatilho excluído com sucesso!', 'success');
        await loadTriggers();
      }
    } catch (error) {
      console.error("Failed to delete trigger", error);
      notifications.showToast('Erro ao excluir gatilho', 'error');
    }
  }
};
</script>
