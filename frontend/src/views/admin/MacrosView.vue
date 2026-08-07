<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PlusIcon, EditIcon, TrashIcon, PlayIcon, SaveIcon, XIcon, PlusCircleIcon, Trash2Icon } from 'lucide-vue-next';
import api from '../../services/api';

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
    console.error('Failed to load macros', err);
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
    } else {
      await api.post('/admin/macros', editingMacro.value);
    }
    closeModal();
    fetchMacros();
  } catch (err) {
    console.error('Failed to save macro', err);
  }
};

const deleteMacro = async (id: number) => {
  if (confirm('Are you sure you want to delete this macro?')) {
    try {
      await api.delete(`/admin/macros/${id}`);
      fetchMacros();
    } catch (err) {
      console.error('Failed to delete macro', err);
    }
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto py-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-df-text mb-2">Macros</h1>
        <p class="text-df-text-muted">Manage automated actions to speed up ticket responses.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        New Macro
      </button>
    </div>

    <!-- Table -->
    <div class="glass-panel rounded-xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-df-text-muted">Loading macros...</div>
      
      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-white/5 text-xs text-df-text-muted uppercase tracking-wider">
            <th class="py-4 px-6 font-semibold">Name</th>
            <th class="py-4 px-6 font-semibold">Description</th>
            <th class="py-4 px-6 font-semibold">Actions Count</th>
            <th class="py-4 px-6 font-semibold">Status</th>
            <th class="py-4 px-6 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-if="macros.length === 0">
            <td colspan="5" class="py-8 text-center text-df-text-muted">No macros found. Create one to get started.</td>
          </tr>
          <tr v-for="macro in macros" :key="macro.id" class="hover:bg-white/5 transition-colors group">
            <td class="py-4 px-6 font-medium text-df-text">{{ macro.name }}</td>
            <td class="py-4 px-6 text-df-text-muted text-sm">{{ macro.description || '-' }}</td>
            <td class="py-4 px-6 text-df-text-muted text-sm">
              <span class="px-2 py-1 bg-white/5 rounded-md">{{ macro.actions?.length || 0 }} actions</span>
            </td>
            <td class="py-4 px-6">
              <span v-if="macro.isActive" class="px-2 py-1 text-xs font-medium rounded bg-green-500/20 text-green-400">Active</span>
              <span v-else class="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400">Inactive</span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <button @click="openEditModal(macro)" class="p-2 text-df-text-muted hover:text-df-text bg-white/5 hover:bg-white/10 rounded transition-colors" title="Edit">
                <EditIcon class="w-4 h-4" />
              </button>
              <button @click="deleteMacro(macro.id)" class="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors" title="Delete">
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
      
      <div class="relative bg-df-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 class="text-xl font-bold text-df-text flex items-center gap-2">
            <PlayIcon class="w-5 h-5 text-df-primary" />
            {{ editingMacro?.id ? 'Edit Macro' : 'Create Macro' }}
          </h2>
          <button @click="closeModal" class="text-df-text-muted hover:text-white transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-df-text-muted mb-2">Macro Name</label>
              <input v-model="editingMacro!.name" type="text" class="input-field w-full" placeholder="e.g. Close as Duplicate">
            </div>
            <div>
              <label class="block text-sm font-medium text-df-text-muted mb-2">Status</label>
              <div class="flex items-center h-10">
                <label class="flex items-center cursor-pointer gap-2">
                  <input type="checkbox" v-model="editingMacro!.isActive" class="rounded bg-white/5 border-white/10 text-df-primary focus:ring-df-primary focus:ring-offset-df-bg">
                  <span class="text-sm text-df-text">Macro is Active</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-2">Description</label>
            <input v-model="editingMacro!.description" type="text" class="input-field w-full" placeholder="Briefly describe what this macro does">
          </div>

          <div class="pt-6 border-t border-white/10">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-df-text">Actions</h3>
              <button @click="addAction" class="text-sm text-df-primary hover:text-df-accent font-medium flex items-center gap-1 transition-colors">
                <PlusCircleIcon class="w-4 h-4" /> Add Action
              </button>
            </div>

            <div v-if="editingMacro!.actions?.length === 0" class="text-center py-8 text-df-text-muted bg-white/5 rounded-lg border border-white/10 border-dashed">
              No actions defined yet. Click "Add Action" to begin.
            </div>

            <div class="space-y-4">
              <div v-for="(action, index) in editingMacro!.actions" :key="index" class="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                <button @click="removeAction(index)" class="absolute top-4 right-4 text-df-text-muted hover:text-red-400 transition-colors">
                  <Trash2Icon class="w-4 h-4" />
                </button>
                
                <div class="grid grid-cols-3 gap-4 mr-8">
                  <div class="col-span-1">
                    <label class="block text-xs font-medium text-df-text-muted mb-1">Field</label>
                    <select v-model="action.field" class="input-field w-full text-sm">
                      <option value="state_id">Set State</option>
                      <option value="group_id">Set Group</option>
                      <option value="article">Add Article (Reply)</option>
                    </select>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-df-text-muted mb-1">Value</label>
                    
                    <!-- State specific input -->
                    <select v-if="action.field === 'state_id'" v-model="action.value" class="input-field w-full text-sm">
                      <option :value="1">New</option>
                      <option :value="2">Open</option>
                      <option :value="3">Pending Reminder</option>
                      <option :value="4">Closed</option>
                    </select>
                    
                    <!-- Group specific input (simple text for now, ideally fetched from groups API) -->
                    <input v-else-if="action.field === 'group_id'" v-model="action.value" type="number" class="input-field w-full text-sm" placeholder="Group ID">
                    
                    <!-- Article specific input -->
                    <div v-else-if="action.field === 'article'" class="space-y-3">
                      <!-- Initialize structure if primitive or empty -->
                      <span class="hidden">{{ typeof action.value !== 'object' ? action.value = { body: '', is_internal: false } : '' }}</span>
                      
                      <textarea v-model="action.value.body" rows="3" class="input-field w-full text-sm" placeholder="Write the reply message..."></textarea>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="action.value.is_internal" class="rounded bg-white/5 border-white/10 text-df-primary focus:ring-df-primary focus:ring-offset-df-bg">
                        <span class="text-xs text-df-text-muted">Internal Note (Hidden from customer)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button @click="closeModal" class="btn-secondary">Cancel</button>
          <button @click="saveMacro" class="btn-primary flex items-center gap-2">
            <SaveIcon class="w-4 h-4" /> Save Macro
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-df-text focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent transition-all;
}
.input-field::placeholder {
  @apply text-df-text-muted/50;
}
</style>
