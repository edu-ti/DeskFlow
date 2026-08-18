<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Respostas Prontas</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ modules.length }} {{ modules.length === 1 ? 'resposta' : 'respostas' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Textos prontos para inserção rápida nos chamados</p>
      </div>
      <button @click="openModal()" class="inline-flex items-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 active:scale-95">
        <FileTextIcon class="w-4 h-4" />
        <span>Nova Resposta</span>
      </button>
    </div>

    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando respostas...</span>
      </div>
      <div v-else-if="modules.length === 0" class="p-12 text-center text-gray-500">
        <FileTextIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhuma resposta pronta</p>
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="m in modules" :key="m.id" class="px-6 py-4 flex items-start justify-between gap-4 hover:bg-blue-50/30">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-900">{{ m.name }}</span>
              <span v-if="m.keywords?.length" class="flex gap-1 flex-wrap">
                <span v-for="k in m.keywords" :key="k" class="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{{ k }}</span>
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{{ m.content }}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button @click="openModal(m)" class="p-1.5 text-gray-400 hover:text-df-primary hover:bg-blue-50 rounded-lg"><Edit2Icon class="w-4 h-4" /></button>
            <button @click="remove(m.id)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2Icon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 class="text-lg font-bold text-gray-900">{{ editing ? 'Editar Resposta' : 'Nova Resposta' }}</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"><XIcon class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="save" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome *</label>
            <input v-model="form.name" type="text" required class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Palavras-chave (separadas por vírgula)</label>
            <input v-model="keywordsText" type="text" placeholder="boas vindas, saudacao" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Conteúdo *</label>
            <textarea v-model="form.content" rows="5" required class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-df-primary focus:ring-df-primary/20" />
            Ativa
          </label>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" @click="closeModal" class="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" :disabled="isSubmitting" class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2">
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
import { ref, onMounted } from 'vue'
import { FileText as FileTextIcon, Edit2 as Edit2Icon, Trash2 as Trash2Icon, X as XIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import { textModulesService } from '../../services/textModulesService'

const modules = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editing = ref<any>(null)
const form = ref({ name: '', content: '', active: true })
const keywordsText = ref('')

const loadData = async () => {
  isLoading.value = true
  try {
    modules.value = (await textModulesService.getAll()) || []
  } catch (e) {
    console.error('Erro ao carregar respostas:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const openModal = (m?: any) => {
  editing.value = m || null
  if (m) {
    form.value = { name: m.name || '', content: m.content || '', active: m.active !== false }
    keywordsText.value = (m.keywords || []).join(', ')
  } else {
    form.value = { name: '', content: '', active: true }
    keywordsText.value = ''
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const save = async () => {
  isSubmitting.value = true
  try {
    const payload: any = { ...form.value }
    payload.keywords = keywordsText.value.split(',').map((k) => k.trim()).filter(Boolean)
    if (editing.value) {
      await textModulesService.update(editing.value.id, payload)
    } else {
      await textModulesService.create(payload)
    }
    closeModal()
    await loadData()
  } catch (e) {
    console.error('Erro ao salvar resposta:', e)
    alert('Erro ao salvar resposta.')
  } finally {
    isSubmitting.value = false
  }
}

const remove = async (id: number) => {
  if (confirm('Excluir esta resposta?')) {
    try {
      await textModulesService.remove(id)
      await loadData()
    } catch (e) {
      console.error('Erro ao excluir resposta:', e)
    }
  }
}
</script>
