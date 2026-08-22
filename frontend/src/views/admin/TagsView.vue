<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Etiquetas (Tags)</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ filteredTags.length }} {{ filteredTags.length === 1 ? 'etiqueta' : 'etiquetas' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Etiquetas livres para classificar chamados</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative w-64">
          <SearchIcon class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar etiqueta..."
            class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
          />
        </div>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 active:scale-95"
        >
          <TagPlusIcon class="w-4 h-4" />
          <span>Nova</span>
        </button>
      </div>
    </div>

    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando etiquetas...</span>
      </div>

      <div v-else-if="filteredTags.length === 0" class="p-12 text-center text-gray-500">
        <TagIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhuma etiqueta encontrada</p>
      </div>

      <div v-else class="p-4 flex flex-wrap gap-2">
        <span
          v-for="tag in filteredTags"
          :key="tag.id"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-df-primary border border-blue-100 rounded-full text-sm font-medium"
        >
          <TagIcon class="w-3.5 h-3.5" />
          {{ tag.name }}
          <button @click="editTag(tag)" class="text-gray-400 hover:text-df-primary" title="Editar">
            <Edit2Icon class="w-3 h-3" />
          </button>
          <button @click="deleteTag(tag.id)" class="text-gray-400 hover:text-red-600" title="Excluir">
            <XIcon class="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 class="text-lg font-bold text-gray-900">{{ editingTag ? 'Editar Etiqueta' : 'Nova Etiqueta' }}</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="saveTag" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ex: urgente, vip, cobranca..."
              class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
            />
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" @click="closeModal" class="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { tagsService } from '../../services/tagsService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { success: toastSuccess, error: toastError } = useToast()
const { confirm: dialogConfirm } = useConfirm()

const tags = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editingTag = ref<any>(null)
const searchQuery = ref('')
const form = ref({ name: '' })

const loadData = async () => {
  isLoading.value = true
  try {
    tags.value = (await tagsService.getAll()) || []
  } catch (e) {
    console.error('Erro ao carregar etiquetas:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const filteredTags = computed(() =>
  tags.value.filter((t) => (t.name || '').toLowerCase().includes(searchQuery.value.toLowerCase()))
)

const openCreate = () => {
  editingTag.value = null
  form.value = { name: '' }
  isModalOpen.value = true
}

const editTag = (tag: any) => {
  editingTag.value = tag
  form.value = { name: tag.name || '' }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveTag = async () => {
  isSubmitting.value = true
  try {
    if (editingTag.value) {
      await tagsService.update(editingTag.value.id, form.value)
      toastSuccess('Sucesso', 'Etiqueta atualizada com sucesso.')
    } else {
      await tagsService.create(form.value)
      toastSuccess('Sucesso', 'Etiqueta criada com sucesso.')
    }
    closeModal()
    await loadData()
  } catch (e) {
    console.error('Erro ao salvar etiqueta:', e)
    toastError('Erro', 'Erro ao salvar etiqueta.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteTag = async (id: number) => {
  const ok = await dialogConfirm({
    title: 'Excluir Etiqueta',
    message: 'Tem certeza que deseja excluir esta etiqueta?',
    type: 'danger',
    confirmText: 'Sim, Excluir',
    cancelText: 'Cancelar',
  })
  if (!ok) return

  try {
    await tagsService.remove(id)
    toastSuccess('Sucesso', 'Etiqueta excluída com sucesso.')
    await loadData()
  } catch (e) {
    console.error('Erro ao excluir etiqueta:', e)
    toastError('Erro', 'Não foi possível excluir a etiqueta.')
  }
}
</script>
