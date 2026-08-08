<template>
  <div class="max-w-6xl mx-auto pb-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Políticas de SLA</h1>
        <p class="text-sm text-gray-500 mt-1">Gerencie os Acordos de Nível de Serviço da sua operação.</p>
      </div>
      <button @click="openModal()" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
        <PlusIcon class="w-4 h-4" />
        Nova Política
      </button>
    </div>

    <!-- Lista de Políticas -->
    <div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <div v-if="isLoading" class="p-8 flex justify-center">
        <Loader2Icon class="w-6 h-6 text-df-primary animate-spin" />
      </div>
      
      <div v-else-if="policies.length === 0" class="p-8 text-center text-gray-500">
        Nenhuma política de SLA configurada. Os chamados usarão o SLA padrão do sistema.
      </div>
      
      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo 1ª Resposta</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo Solução</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="policy in policies" :key="policy.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ policy.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-600">{{ getPriorityName(policy.priority_id) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-600">{{ getGroupName(policy.group_id) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-gray-900">{{ formatMinutes(policy.first_response_mins) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-gray-900">{{ formatMinutes(policy.resolution_mins) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="policy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ policy.is_active ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="openModal(policy)" class="text-df-primary hover:text-df-primary-hover mr-4">Editar</button>
              <button @click="deletePolicy(policy.id)" class="text-red-600 hover:text-red-900">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Criação/Edição -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="savePolicy">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                {{ form.id ? 'Editar Política de SLA' : 'Nova Política de SLA' }}
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nome da Política</label>
                  <input type="text" v-model="form.name" required class="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-df-primary focus:border-df-primary">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Prioridade</label>
                    <select v-model="form.priority_id" class="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-df-primary focus:border-df-primary">
                      <option :value="null">Todas as Prioridades</option>
                      <option :value="1">Baixa</option>
                      <option :value="2">Normal</option>
                      <option :value="3">Alta</option>
                      <option :value="4">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Grupo</label>
                    <select v-model="form.group_id" class="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-df-primary focus:border-df-primary">
                      <option :value="null">Todos os Grupos</option>
                      <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Primeira Resposta (minutos)</label>
                    <input type="number" min="1" v-model="form.first_response_mins" required class="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-df-primary focus:border-df-primary">
                    <p class="text-xs text-gray-500 mt-1">{{ formatMinutes(form.first_response_mins) }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Tempo de Solução (minutos)</label>
                    <input type="number" min="1" v-model="form.resolution_mins" required class="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-df-primary focus:border-df-primary">
                    <p class="text-xs text-gray-500 mt-1">{{ formatMinutes(form.resolution_mins) }}</p>
                  </div>
                </div>

                <div class="flex items-center">
                  <input type="checkbox" v-model="form.is_active" id="isActive" class="h-4 w-4 text-df-primary focus:ring-df-primary border-gray-300 rounded">
                  <label for="isActive" class="ml-2 block text-sm text-gray-900">Política Ativa</label>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" :disabled="isSaving" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-df-primary text-base font-medium text-white hover:bg-df-primary-hover focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                <Loader2Icon v-if="isSaving" class="w-4 h-4 animate-spin mr-2" />
                Salvar
              </button>
              <button type="button" @click="closeModal" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus as PlusIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { toastSuccess, toastError } = useToast()

const policies = ref<any[]>([])
const groups = ref<any[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const isSaving = ref(false)

const form = ref({
  id: null as number | null,
  name: '',
  priority_id: null as number | null,
  group_id: null as number | null,
  first_response_mins: 60,
  resolution_mins: 240,
  is_active: true
})

const getPriorityName = (priorityId: number | null) => {
  if (priorityId === null) return 'Qualquer'
  const map: Record<number, string> = { 1: 'Baixa', 2: 'Normal', 3: 'Alta', 4: 'Urgente' }
  return map[priorityId] || String(priorityId)
}

const getGroupName = (groupId: number | null) => {
  if (groupId === null) return 'Qualquer'
  const group = groups.value.find(g => g.id === groupId)
  return group ? group.name : `Grupo #${groupId}`
}

const formatMinutes = (mins: number) => {
  if (!mins) return '0h'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const fetchPolicies = async () => {
  try {
    isLoading.value = true
    const res = await api.get('/sla-policies')
    policies.value = res.data
  } catch (error) {
    console.error("Failed to load SLA policies", error)
  } finally {
    isLoading.value = false
  }
}

const fetchGroups = async () => {
  try {
    const res = await api.get('/groups')
    groups.value = res.data
  } catch (error) {
    console.error("Failed to load groups", error)
  }
}

const openModal = (policy?: any) => {
  if (policy) {
    form.value = { ...policy }
  } else {
    form.value = {
      id: null,
      name: '',
      priority_id: null,
      group_id: null,
      first_response_mins: 60,
      resolution_mins: 240,
      is_active: true
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const savePolicy = async () => {
  try {
    isSaving.value = true
    const payload = {
      ...form.value,
      priority_id: form.value.priority_id || null,
      group_id: form.value.group_id || null
    }

    if (form.value.id) {
      await api.put(`/sla-policies/${form.value.id}`, payload)
      toastSuccess('Sucesso', 'Política de SLA atualizada.')
    } else {
      await api.post('/sla-policies', payload)
      toastSuccess('Sucesso', 'Política de SLA criada.')
    }
    closeModal()
    await fetchPolicies()
  } catch (error) {
    console.error("Error saving policy", error)
  } finally {
    isSaving.value = false
  }
}

const deletePolicy = async (id: number) => {
  if (!confirm('Tem certeza que deseja excluir esta política de SLA?')) return
  try {
    await api.delete(`/sla-policies/${id}`)
    toastSuccess('Sucesso', 'Política excluída.')
    await fetchPolicies()
  } catch (error) {
    console.error("Error deleting policy", error)
  }
}

onMounted(() => {
  fetchGroups()
  fetchPolicies()
})
</script>
