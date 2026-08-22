<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Visões (Overviews)</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ overviews.length }} {{ overviews.length === 1 ? 'visão' : 'visões' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Filas e visões salvas de chamados, filtradas por condição e visíveis por papel</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 active:scale-95"
      >
        <PlusIcon class="w-4 h-4" />
        <span>Nova Visão</span>
      </button>
    </div>

    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando visões...</span>
      </div>
      <div v-else-if="overviews.length === 0" class="p-12 text-center text-gray-500">
        <LayersIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhuma visão encontrada</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200/80 bg-gray-50/60 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-4">Nome</th>
              <th class="py-3.5 px-4">Papéis</th>
              <th class="py-3.5 px-4">Ordenação</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr v-for="o in overviews" :key="o.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-gray-900">{{ o.name }}</td>
              <td class="py-3.5 px-4 text-gray-500">{{ (o.roles || []).join(', ') || 'Todos' }}</td>
              <td class="py-3.5 px-4 text-gray-500">{{ o.order_by }} {{ o.order_direction }}</td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="o.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'">
                  {{ o.active !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button @click="openModal(o)" class="p-1.5 text-gray-400 hover:text-df-primary hover:bg-blue-50 rounded-lg"><Edit2Icon class="w-4 h-4" /></button>
                  <button @click="deleteOverview(o.id)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2Icon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 class="text-lg font-bold text-gray-900">{{ editing ? 'Editar Visão' : 'Nova Visão' }}</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"><XIcon class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="save" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome *</label>
            <input v-model="form.name" type="text" required class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Papéis (separados por vírgula)</label>
              <input v-model="rolesText" type="text" placeholder="admin, agent" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Ordenar por</label>
              <input v-model="form.order_by" type="text" placeholder="created_at" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Condição (JSON)</label>
            <textarea v-model="conditionText" rows="3" placeholder='{"state_id": 1}' class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-df-primary focus:ring-df-primary/20" />
            Visão ativa
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
import { Plus as PlusIcon, Layers as LayersIcon, Edit2 as Edit2Icon, Trash2 as Trash2Icon, X as XIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import { overviewsService } from '../../services/overviewsService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { success: toastSuccess, error: toastError } = useToast()
const { confirm: dialogConfirm } = useConfirm()

const overviews = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editing = ref<any>(null)
const form = ref({ name: '', order_by: 'created_at', order_direction: 'desc', active: true })
const rolesText = ref('')
const conditionText = ref('')

const loadData = async () => {
  isLoading.value = true
  try {
    overviews.value = (await overviewsService.getAll()) || []
  } catch (e) {
    console.error('Erro ao carregar visões:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const openModal = (o?: any) => {
  editing.value = o || null
  if (o) {
    form.value = { name: o.name || '', order_by: o.order_by || 'created_at', order_direction: o.order_direction || 'desc', active: o.active !== false }
    rolesText.value = (o.roles || []).join(', ')
    conditionText.value = o.condition ? JSON.stringify(o.condition, null, 2) : ''
  } else {
    form.value = { name: '', order_by: 'created_at', order_direction: 'desc', active: true }
    rolesText.value = ''
    conditionText.value = ''
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
    payload.roles = rolesText.value.split(',').map((r) => r.trim()).filter(Boolean)
    if (conditionText.value.trim()) {
      try {
        payload.condition = JSON.parse(conditionText.value)
      } catch {
        toastError('Erro de Validação', 'A condição em formato JSON é inválida.')
        isSubmitting.value = false
        return
      }
    }
    if (editing.value) {
      await overviewsService.update(editing.value.id, payload)
      toastSuccess('Sucesso', 'Visão atualizada com sucesso.')
    } else {
      await overviewsService.create(payload)
      toastSuccess('Sucesso', 'Visão criada com sucesso.')
    }
    closeModal()
    await loadData()
  } catch (e) {
    console.error('Erro ao salvar visão:', e)
    toastError('Erro', 'Erro ao salvar visão.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteOverview = async (id: number) => {
  const ok = await dialogConfirm({
    title: 'Excluir Visão',
    message: 'Tem certeza que deseja excluir esta visão?',
    type: 'danger',
    confirmText: 'Sim, Excluir',
    cancelText: 'Cancelar',
  })
  if (!ok) return

  try {
    await overviewsService.remove(id)
    toastSuccess('Sucesso', 'Visão excluída com sucesso.')
    await loadData()
  } catch (e) {
    console.error('Erro ao excluir visão:', e)
    toastError('Erro', 'Não foi possível excluir a visão.')
  }
}
</script>
