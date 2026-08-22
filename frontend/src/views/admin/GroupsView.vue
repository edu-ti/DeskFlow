<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Grupos de Atendimento</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ filteredGroups.length }} {{ filteredGroups.length === 1 ? 'grupo' : 'grupos' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Organize suas filas de atendimento, setores e equipes responsáveis por chamados</p>
      </div>
      <button 
        @click="openModal()" 
        class="inline-flex items-center justify-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
      >
        <FolderPlusIcon class="w-4 h-4" />
        <span>Novo Grupo</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <SearchIcon class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar grupo..."
          class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
        />
      </div>
    </div>

    <!-- Groups Table -->
    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando grupos...</span>
      </div>

      <div v-else-if="filteredGroups.length === 0" class="p-12 text-center text-gray-500">
        <FolderIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhum grupo encontrado</p>
        <p class="text-xs text-gray-400 mt-1">Crie um novo grupo para rotear chamados por departamento.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200/80 bg-gray-50/60 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-4 w-20">ID</th>
              <th class="py-3.5 px-4">Nome do Grupo</th>
              <th class="py-3.5 px-4">Status / Identificador</th>
              <th class="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr 
              v-for="group in filteredGroups" 
              :key="group.id" 
              class="hover:bg-blue-50/30 transition-colors group"
            >
              <td class="py-3.5 px-4 font-mono text-xs text-gray-400">
                #{{ group.id }}
              </td>

              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-50 text-df-primary rounded-xl border border-blue-100">
                    <FolderIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="font-semibold text-gray-900 block leading-tight">{{ group.name }}</span>
                    <span class="text-xs text-gray-400">Fila de atendimento</span>
                  </div>
                </div>
              </td>

              <td class="py-3.5 px-4">
                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Ativo
                </span>
              </td>

              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button 
                    @click="openModal(group)" 
                    class="p-1.5 text-gray-400 hover:text-df-primary hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Grupo"
                  >
                    <Edit2Icon class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteGroup(group.id)" 
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Grupo"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Group Modal (Create / Edit) -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-df-primary rounded-xl">
              <FolderPlusIcon v-if="!editingGroup" class="w-5 h-5" />
              <Edit2Icon v-else class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ editingGroup ? 'Editar Grupo' : 'Novo Grupo' }}</h2>
              <p class="text-xs text-gray-500">{{ editingGroup ? 'Modifique o nome do setor' : 'Crie um novo departamento para os chamados' }}</p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Modal Form -->
        <form @submit.prevent="saveGroup" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome do Grupo / Setor *</label>
            <input 
              v-model="form.name" 
              type="text" 
              required 
              placeholder="Ex: Suporte N1, Financeiro, Infraestrutura..."
              class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
            />
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              @click="closeModal" 
              class="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ editingGroup ? 'Salvar Alterações' : 'Criar Grupo' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  FolderPlus as FolderPlusIcon, 
  Folder as FolderIcon, 
  Search as SearchIcon, 
  Edit2 as Edit2Icon, 
  Trash2 as Trash2Icon, 
  X as XIcon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'
import { adminService } from '../../services/adminService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { success: toastSuccess, error: toastError } = useToast()
const { confirm: dialogConfirm } = useConfirm()

const groups = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editingGroup = ref<any>(null)
const searchQuery = ref('')

const form = ref({
  name: ''
})

const loadData = async () => {
  isLoading.value = true
  try {
    const fetched = await adminService.getGroups()
    groups.value = fetched || []
  } catch (error) {
    console.error('Erro ao carregar grupos:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredGroups = computed(() => {
  return groups.value.filter(g => {
    const name = (g.name || '').toLowerCase()
    const query = searchQuery.value.toLowerCase()
    return name.includes(query)
  })
})

const openModal = (group?: any) => {
  editingGroup.value = group || null
  if (group) {
    form.value = { name: group.name || '' }
  } else {
    form.value = { name: '' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveGroup = async () => {
  isSubmitting.value = true
  try {
    if (editingGroup.value) {
      await adminService.updateGroup(editingGroup.value.id, form.value)
      toastSuccess('Sucesso', 'Grupo atualizado com sucesso.')
    } else {
      await adminService.createGroup(form.value)
      toastSuccess('Sucesso', 'Grupo criado com sucesso.')
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('Erro ao salvar grupo:', error)
    toastError('Erro', 'Erro ao salvar grupo.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteGroup = async (id: number) => {
  const ok = await dialogConfirm({
    title: 'Excluir Grupo',
    message: 'Tem certeza que deseja excluir este grupo? Ele não poderá ser excluído se possuir chamados ou agentes vinculados.',
    type: 'danger',
    confirmText: 'Sim, Excluir',
    cancelText: 'Cancelar',
  })
  if (!ok) return

  try {
    await adminService.deleteGroup(id)
    toastSuccess('Sucesso', 'Grupo excluído com sucesso.')
    await loadData()
  } catch (error) {
    console.error('Erro ao excluir grupo:', error)
    toastError('Erro', 'Não foi possível excluir o grupo. Ele pode estar vinculado a chamados existentes.')
  }
}
</script>
