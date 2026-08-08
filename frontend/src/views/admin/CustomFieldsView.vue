<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { SettingsIcon, PlusIcon, Edit2Icon, Trash2Icon } from 'lucide-vue-next';
import { customFieldsService, type CustomField } from '../../services/customFieldsService';

const customFields = ref<CustomField[]>([]);
const isLoading = ref(true);

const showModal = ref(false);
const editingField = ref<CustomField | null>(null);

const formData = ref({
  name: '',
  type: 'text',
  options: '',
  is_required: false,
  group_id: null as number | null
});

onMounted(async () => {
  await loadFields();
});

const loadFields = async () => {
  isLoading.value = true;
  try {
    customFields.value = await customFieldsService.getCustomFields();
  } catch (error) {
    alert('Falha ao carregar campos personalizados');
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  editingField.value = null;
  formData.value = {
    name: '',
    type: 'text',
    options: '',
    is_required: false,
    group_id: null
  };
  showModal.value = true;
};

const openEditModal = (field: CustomField) => {
  editingField.value = field;
  formData.value = {
    name: field.name,
    type: field.type,
    options: field.options || '',
    is_required: field.is_required,
    group_id: field.group_id
  };
  showModal.value = true;
};

const saveField = async () => {
  try {
    if (editingField.value) {
      await customFieldsService.updateCustomField(editingField.value.id, formData.value);
    } else {
      await customFieldsService.createCustomField(formData.value);
    }
    showModal.value = false;
    await loadFields();
  } catch (error) {
    alert('Falha ao salvar campo');
  }
};

const deleteField = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir este campo? Isso não removerá dados existentes, mas o ocultará dos formulários.')) {
    try {
      await customFieldsService.deleteCustomField(id);
      await loadFields();
    } catch (error) {
      alert('Falha ao excluir campo');
    }
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Campos Personalizados</h1>
        <p class="text-gray-500">Gerencie campos adicionais para chamados.</p>
      </div>
      <button @click="openCreateModal" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        Criar Campo
      </button>
    </div>

    <div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-gray-500">Carregando...</div>
      
      <table v-else class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Obrigatório</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="field in customFields" :key="field.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-gray-800">{{ field.name }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 bg-blue-100 text-df-primary text-xs font-medium rounded-full">
                {{ field.type }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span v-if="field.is_required" class="text-xs text-red-500">Sim</span>
              <span v-else class="text-xs text-gray-500">Não</span>
            </td>
            <td class="px-6 py-4">
              <span v-if="field.group_id" class="text-xs text-gray-800">Grupo {{ field.group_id }}</span>
              <span v-else class="text-xs text-gray-500">Todos os Grupos</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="openEditModal(field)" class="p-2 text-df-primary hover:text-df-primary-hover hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2Icon class="w-4 h-4" />
                </button>
                <button @click="deleteField(field.id)" class="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2Icon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="customFields.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
              Nenhum campo personalizado encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">{{ editingField ? 'Editar Campo' : 'Criar Campo' }}</h2>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input v-model="formData.name" type="text" class="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" placeholder="ex: Sistema Operacional" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select v-model="formData.type" class="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary">
              <option value="text">Texto (Linha única)</option>
              <option value="number">Número</option>
              <option value="select">Lista Suspensa (Select)</option>
            </select>
          </div>

          <div v-if="formData.type === 'select'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Opções (separadas por vírgula)</label>
            <input v-model="formData.options" type="text" class="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" placeholder="Windows, Linux, macOS" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Grupo (Opcional)</label>
            <input v-model.number="formData.group_id" type="number" class="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" placeholder="Deixe vazio para todos os grupos" />
          </div>

          <div class="flex items-center gap-2">
            <input v-model="formData.is_required" type="checkbox" id="isRequired" class="rounded border-gray-300 text-df-primary focus:ring-df-primary" />
            <label for="isRequired" class="text-sm text-gray-800">Campo obrigatório</label>
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Cancelar</button>
          <button @click="saveField" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md">Salvar Campo</button>
        </div>
      </div>
    </div>
  </div>
</template>
