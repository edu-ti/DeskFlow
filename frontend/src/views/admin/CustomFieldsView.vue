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
    alert('Failed to load custom fields');
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
    alert('Failed to save field');
  }
};

const deleteField = async (id: number) => {
  if (confirm('Are you sure you want to delete this field? This will not remove existing data but will hide it from forms.')) {
    try {
      await customFieldsService.deleteCustomField(id);
      await loadFields();
    } catch (error) {
      alert('Failed to delete field');
    }
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-df-text mb-2">Custom Fields</h1>
        <p class="text-df-text-muted">Manage additional fields for tickets.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        Create Field
      </button>
    </div>

    <div class="glass-panel rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-df-text-muted">Loading...</div>
      
      <table v-else class="w-full text-left">
        <thead class="bg-white/5 border-b border-white/10">
          <tr>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase tracking-wider">Name</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase tracking-wider">Type</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase tracking-wider">Required</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase tracking-wider">Group</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-df-text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/10">
          <tr v-for="field in customFields" :key="field.id" class="hover:bg-white/5 transition-colors">
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-df-text">{{ field.name }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 bg-df-primary/20 text-df-primary text-xs font-medium rounded-full">
                {{ field.type }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span v-if="field.is_required" class="text-xs text-red-400">Yes</span>
              <span v-else class="text-xs text-df-text-muted">No</span>
            </td>
            <td class="px-6 py-4">
              <span v-if="field.group_id" class="text-xs text-df-text">Group {{ field.group_id }}</span>
              <span v-else class="text-xs text-df-text-muted">All Groups</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="openEditModal(field)" class="p-2 text-df-text-muted hover:text-df-text hover:bg-white/10 rounded-lg transition-colors">
                  <Edit2Icon class="w-4 h-4" />
                </button>
                <button @click="deleteField(field.id)" class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2Icon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="customFields.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-sm text-df-text-muted">
              No custom fields found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-df-bg border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-white/10">
          <h2 class="text-xl font-bold text-df-text">{{ editingField ? 'Edit Field' : 'Create Field' }}</h2>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Name</label>
            <input v-model="formData.name" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-df-text focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" placeholder="e.g. Operating System" />
          </div>

          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Type</label>
            <select v-model="formData.type" class="w-full bg-[#202020] border border-white/10 rounded-lg py-2 px-3 text-df-text focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary">
              <option value="text">Text (Single line)</option>
              <option value="number">Number</option>
              <option value="select">Dropdown (Select)</option>
            </select>
          </div>

          <div v-if="formData.type === 'select'">
            <label class="block text-sm font-medium text-df-text-muted mb-1">Options (comma separated)</label>
            <input v-model="formData.options" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-df-text focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" placeholder="Windows, Linux, macOS" />
          </div>

          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Group (Optional)</label>
            <input v-model.number="formData.group_id" type="number" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-df-text focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" placeholder="Leave empty for all groups" />
          </div>

          <div class="flex items-center gap-2">
            <input v-model="formData.is_required" type="checkbox" id="isRequired" class="rounded bg-white/5 border-white/10 text-df-primary focus:ring-df-primary" />
            <label for="isRequired" class="text-sm text-df-text">Required field</label>
          </div>
        </div>

        <div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5">
          <button @click="showModal = false" class="px-4 py-2 text-sm font-medium text-df-text-muted hover:text-df-text transition-colors">Cancel</button>
          <button @click="saveField" class="btn-primary">Save Field</button>
        </div>
      </div>
    </div>
  </div>
</template>
