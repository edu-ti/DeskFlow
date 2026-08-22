<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon, EditIcon, TrashIcon, PlayIcon, SaveIcon, XIcon, PlusCircleIcon, Trash2Icon } from 'lucide-vue-next';
import api from '../../services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const { success: toastSuccess, error: toastError } = useToast();
const { confirm: dialogConfirm } = useConfirm();

interface MacroAction {
  field: string;
  value: any;
}

interface Macro {
  id: number;
  name: string;
  description: string;
  actions: MacroAction[];
  isActive: boolean;
}

const macros = ref<Macro[]>([]);
const isLoading = ref(true);

const showModal = ref(false);
const editingMacro = ref<Partial<Macro> | null>(null);

const fetchMacros = async () => {
  isLoading.value = true;
  try {
    const res = await api.get('/admin/macros');
    macros.value = res.data;
  } catch (err) {
    console.error('Falha ao carregar macros', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchMacros();
});

const openCreateModal = () => {
  editingMacro.value = {
    name: '',
    description: '',
    isActive: true,
    actions: []
  };
  showModal.value = true;
};

const openEditModal = (macro: Macro) => {
  editingMacro.value = JSON.parse(JSON.stringify(macro)); // deep copy
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingMacro.value = null;
};

const addAction = () => {
  if (editingMacro.value && editingMacro.value.actions) {
    editingMacro.value.actions.push({ field: 'state_id', value: '' });
  }
};

const removeAction = (index: number) => {
  if (editingMacro.value && editingMacro.value.actions) {
    editingMacro.value.actions.splice(index, 1);
  }
};

const saveMacro = async () => {
  if (!editingMacro.value) return;

  try {
    if (editingMacro.value.id) {
      await api.put(`/admin/macros/${editingMacro.value.id}`, editingMacro.value);
      toastSuccess('Sucesso', 'Macro atualizada com sucesso.');
    } else {
      await api.post('/admin/macros', editingMacro.value);
      toastSuccess('Sucesso', 'Macro criada com sucesso.');
    }
    closeModal();
    fetchMacros();
  } catch (err) {
    console.error('Falha ao salvar macro', err);
    toastError('Erro', 'Falha ao salvar macro.');
  }
};

const deleteMacro = async (id: number) => {
  const ok = await dialogConfirm({
    title: 'Excluir Macro',
    message: 'Tem certeza que deseja excluir esta macro?',
    type: 'danger',
    confirmText: 'Sim, Excluir',
    cancelText: 'Cancelar',
  });
  if (!ok) return;

  try {
    await api.delete(`/admin/macros/${id}`);
    toastSuccess('Sucesso', 'Macro excluída com sucesso.');
    fetchMacros();
  } catch (err) {
    console.error('Falha ao excluir macro', err);
    toastError('Erro', 'Falha ao excluir macro.');
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto py-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Macros</h1>
        <p class="text-gray-500">Gerencie ações automatizadas para acelerar respostas de chamados.</p>
      </div>
      <button @click="openCreateModal" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        Nova Macro
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-gray-500">Carregando macros...</div>
      
      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th class="py-4 px-6 font-semibold">Nome</th>
            <th class="py-4 px-6 font-semibold">Descrição</th>
            <th class="py-4 px-6 font-semibold">Total de Ações</th>
            <th class="py-4 px-6 font-semibold">Status</th>
            <th class="py-4 px-6 font-semibold text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="macros.length === 0">
            <td colspan="5" class="py-8 text-center text-gray-500">Nenhuma macro encontrada. Crie uma para começar.</td>
          </tr>
          <tr v-for="macro in macros" :key="macro.id" class="hover:bg-gray-50 transition-colors group">
            <td class="py-4 px-6 font-medium text-gray-800">{{ macro.name }}</td>
            <td class="py-4 px-6 text-gray-500 text-sm">{{ macro.description || '-' }}</td>
            <td class="py-4 px-6 text-gray-500 text-sm">
              <span class="px-2 py-1 bg-gray-100 rounded-md font-medium text-gray-600">{{ macro.actions?.length || 0 }} ações</span>
            </td>
            <td class="py-4 px-6">
              <span v-if="macro.isActive" class="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">Ativa</span>
              <span v-else class="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">Inativa</span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <button @click="openEditModal(macro)" class="p-2 text-df-primary hover:text-df-primary-hover hover:bg-gray-100 rounded transition-colors" title="Editar">
                <EditIcon class="w-4 h-4" />
              </button>
              <button @click="deleteMacro(macro.id)" class="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="relative bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PlayIcon class="w-5 h-5 text-df-primary" />
            {{ editingMacro?.id ? 'Editar Macro' : 'Criar Macro' }}
          </h2>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-800 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nome da Macro</label>
              <input v-model="editingMacro!.name" type="text" class="input-field w-full" placeholder="ex: Fechar como Duplicado">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div class="flex items-center h-10">
                <label class="flex items-center cursor-pointer gap-2">
                  <input type="checkbox" v-model="editingMacro!.isActive" class="rounded border-gray-300 text-df-primary focus:ring-df-primary">
                  <span class="text-sm text-gray-800">Macro está Ativa</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <input v-model="editingMacro!.description" type="text" class="input-field w-full" placeholder="Descreva brevemente o que esta macro faz">
          </div>

          <div class="pt-6 border-t border-gray-200">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-800">Ações</h3>
              <button @click="addAction" class="text-sm text-df-primary hover:text-df-primary-hover font-medium flex items-center gap-1 transition-colors">
                <PlusCircleIcon class="w-4 h-4" /> Adicionar Ação
              </button>
            </div>

            <div v-if="editingMacro!.actions?.length === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
              Nenhuma ação definida. Clique em "Adicionar Ação" para começar.
            </div>

            <div class="space-y-4">
              <div v-for="(action, index) in editingMacro!.actions" :key="index" class="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                <button @click="removeAction(index)" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2Icon class="w-4 h-4" />
                </button>
                
                <div class="grid grid-cols-3 gap-4 mr-8">
                  <div class="col-span-1">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Campo</label>
                    <select v-model="action.field" class="input-field w-full text-sm">
                      <option value="state_id">Definir Status</option>
                      <option value="group_id">Definir Grupo</option>
                      <option value="article">Adicionar Artigo (Resposta)</option>
                    </select>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Valor</label>
                    
                    <!-- State specific input -->
                    <select v-if="action.field === 'state_id'" v-model="action.value" class="input-field w-full text-sm">
                      <option :value="1">Novo</option>
                      <option :value="2">Aberto</option>
                      <option :value="3">Pendente Lembrete</option>
                      <option :value="4">Fechado</option>
                    </select>
                    
                    <!-- Group specific input (simple text for now, ideally fetched from groups API) -->
                    <input v-else-if="action.field === 'group_id'" v-model="action.value" type="number" class="input-field w-full text-sm" placeholder="ID do Grupo">
                    
                    <!-- Article specific input -->
                    <div v-else-if="action.field === 'article'" class="space-y-3">
                      <!-- Initialize structure if primitive or empty -->
                      <span class="hidden">{{ typeof action.value !== 'object' ? action.value = { body: '', is_internal: false } : '' }}</span>
                      
                      <textarea v-model="action.value.body" rows="3" class="input-field w-full text-sm resize-none" placeholder="Escreva a mensagem de resposta..."></textarea>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="action.value.is_internal" class="rounded border-gray-300 text-df-primary focus:ring-df-primary">
                        <span class="text-xs text-gray-500">Nota Interna (Oculta do cliente)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button @click="closeModal" class="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-800 transition-colors">Cancelar</button>
          <button @click="saveMacro" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md">
            <SaveIcon class="w-4 h-4" /> Salvar Macro
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-df-primary focus:border-df-primary transition-all;
}
.input-field::placeholder {
  @apply text-gray-400;
}
</style>
