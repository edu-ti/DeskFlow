<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Grupos</h1>
        <p class="text-gray-500 text-sm mt-1">Gerencie grupos de chamados e departamentos</p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
      >
        Novo Grupo
      </button>
    </div>

    <!-- Groups Table -->
    <div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm">
            <th class="p-4 font-medium uppercase tracking-wider text-xs w-16">ID</th>
            <th class="p-4 font-medium uppercase tracking-wider text-xs">Nome</th>
            <th class="p-4 font-medium uppercase tracking-wider text-xs text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-800">
          <tr 
            v-for="group in groups" 
            :key="group.id" 
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="p-4 text-gray-500">#{{ group.id }}</td>
            <td class="p-4 font-medium">{{ group.name }}</td>
            <td class="p-4 text-right space-x-2">
              <button @click="openModal(group)" class="text-df-primary hover:text-df-primary-hover transition-colors font-medium">Editar</button>
              <button @click="deleteGroup(group.id)" class="text-red-500 hover:text-red-600 transition-colors font-medium">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/New Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white border border-gray-200 shadow-xl rounded-2xl w-full max-w-sm p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">{{ editingGroup ? 'Editar Grupo' : 'Novo Grupo' }}</h2>
        
        <form @submit.prevent="saveGroup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Grupo</label>
            <input v-model="form.name" type="text" required class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="closeModal" class="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md">Salvar</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminService } from '../../services/adminService'

const groups = ref<any[]>([])
const isModalOpen = ref(false)
const editingGroup = ref<any>(null)
const form = ref({
  name: ''
})

const loadData = async () => {
  groups.value = await adminService.getGroups()
}

onMounted(() => {
  loadData()
})

const openModal = (group?: any) => {
  editingGroup.value = group || null
  if (group) {
    form.value = { name: group.name }
  } else {
    form.value = { name: '' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveGroup = async () => {
  if (editingGroup.value) {
    await adminService.updateGroup(editingGroup.value.id, form.value)
  } else {
    await adminService.createGroup(form.value)
  }
  closeModal()
  loadData()
}

const deleteGroup = async (id: number) => {
  if(confirm('Tem certeza que deseja excluir este grupo?')) {
    await adminService.deleteGroup(id)
    loadData()
  }
}
</script>
