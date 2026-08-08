<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Usuários</h1>
        <p class="text-gray-500 text-sm mt-1">Gerencie usuários do sistema, agentes e suas funções</p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
      >
        Novo Usuário
      </button>
    </div>

    <!-- Users Table -->
    <div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm">
            <th class="p-4 font-medium uppercase tracking-wider text-xs">Nome</th>
            <th class="p-4 font-medium uppercase tracking-wider text-xs">E-mail</th>
            <th class="p-4 font-medium uppercase tracking-wider text-xs">Funções</th>
            <th class="p-4 font-medium uppercase tracking-wider text-xs">Grupos</th>
            <th class="p-4 font-medium uppercase tracking-wider text-xs text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-800">
          <tr 
            v-for="user in users" 
            :key="user.id" 
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="p-4 font-medium">{{ user.firstname }} {{ user.lastname }}</td>
            <td class="p-4 text-gray-500">{{ user.email }}</td>
            <td class="p-4">
              <span v-for="r in user.roles" :key="r.id" class="px-2 py-0.5 bg-blue-100 text-df-primary rounded-full text-xs font-medium mr-1">
                {{ r.name }}
              </span>
            </td>
            <td class="p-4">
              <span v-for="g in user.groups" :key="g.id" class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mr-1">
                {{ g.name }}
              </span>
            </td>
            <td class="p-4 text-right space-x-2">
              <button @click="openModal(user)" class="text-df-primary hover:text-df-primary-hover transition-colors font-medium">Editar</button>
              <button @click="deleteUser(user.id)" class="text-red-500 hover:text-red-600 transition-colors font-medium">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/New Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white border border-gray-200 shadow-xl rounded-2xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">{{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
        
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input v-model="form.firstname" type="text" required class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
            <input v-model="form.lastname" type="text" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail / Login</label>
            <input v-model="form.email" type="email" required class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
          </div>
          <div v-if="!editingUser">
            <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input v-model="form.password" type="password" required class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Funções</label>
            <select v-model="form.roleIds" multiple class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
              <option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Grupos</label>
            <select v-model="form.groupIds" multiple class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-df-primary">
              <option v-for="g in allGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
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

const users = ref<any[]>([])
const allRoles = ref<any[]>([])
const allGroups = ref<any[]>([])

const isModalOpen = ref(false)
const editingUser = ref<any>(null)
const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  roleIds: [] as number[],
  groupIds: [] as number[]
})

const loadData = async () => {
  users.value = await adminService.getUsers()
  allRoles.value = await adminService.getRoles()
  allGroups.value = await adminService.getGroups()
}

onMounted(() => {
  loadData()
})

const openModal = (user?: any) => {
  editingUser.value = user || null
  if (user) {
    form.value = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password: '',
      roleIds: user.roles?.map((r: any) => r.id) || [],
      groupIds: user.groups?.map((g: any) => g.id) || []
    }
  } else {
    form.value = { firstname: '', lastname: '', email: '', password: '', roleIds: [], groupIds: [] }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveUser = async () => {
  const payload: any = { ...form.value, login: form.value.email }
  // Map IDs back to objects for TypeORM relations
  payload.roles = form.value.roleIds.map(id => ({ id }))
  payload.groups = form.value.groupIds.map(id => ({ id }))
  
  if (editingUser.value) {
    delete payload.password // don't update password for now
    await adminService.updateUser(editingUser.value.id, payload)
  } else {
    await adminService.createUser(payload)
  }
  closeModal()
  loadData()
}

const deleteUser = async (id: number) => {
  if(confirm('Tem certeza que deseja excluir este usuário?')) {
    await adminService.deleteUser(id)
    loadData()
  }
}
</script>
