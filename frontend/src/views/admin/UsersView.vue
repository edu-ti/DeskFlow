<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-df-text">Users</h1>
        <p class="text-df-text-muted text-sm mt-1">Manage system users, agents and their roles</p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-df-primary hover:bg-df-accent text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        New User
      </button>
    </div>

    <!-- Users Table -->
    <div class="glass-panel overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/5 text-df-text-muted text-sm">
            <th class="p-4 font-medium">Name</th>
            <th class="p-4 font-medium">Email</th>
            <th class="p-4 font-medium">Roles</th>
            <th class="p-4 font-medium">Groups</th>
            <th class="p-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm text-df-text">
          <tr 
            v-for="user in users" 
            :key="user.id" 
            class="border-b border-white/5 hover:bg-white/5 transition-colors"
          >
            <td class="p-4 font-medium">{{ user.firstname }} {{ user.lastname }}</td>
            <td class="p-4 text-df-text-muted">{{ user.email }}</td>
            <td class="p-4">
              <span v-for="r in user.roles" :key="r.id" class="px-2 py-0.5 bg-df-primary/20 text-df-primary rounded-full text-xs mr-1">
                {{ r.name }}
              </span>
            </td>
            <td class="p-4">
              <span v-for="g in user.groups" :key="g.id" class="px-2 py-0.5 bg-white/10 text-df-text-muted rounded-full text-xs mr-1">
                {{ g.name }}
              </span>
            </td>
            <td class="p-4 text-right space-x-2">
              <button @click="openModal(user)" class="text-df-primary hover:text-df-accent transition-colors">Edit</button>
              <button @click="deleteUser(user.id)" class="text-red-400 hover:text-red-300 transition-colors">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/New Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="glass-panel w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-df-text mb-4">{{ editingUser ? 'Edit User' : 'New User' }}</h2>
        
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">First Name</label>
            <input v-model="form.firstname" type="text" required class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Last Name</label>
            <input v-model="form.lastname" type="text" class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Email / Login</label>
            <input v-model="form.email" type="email" required class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
          </div>
          <div v-if="!editingUser">
            <label class="block text-sm font-medium text-df-text-muted mb-1">Password</label>
            <input v-model="form.password" type="password" required class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Roles</label>
            <select v-model="form.roleIds" multiple class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
              <option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Groups</label>
            <select v-model="form.groupIds" multiple class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
              <option v-for="g in allGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="closeModal" class="px-4 py-2 rounded-lg font-medium text-df-text-muted hover:text-df-text hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" class="bg-df-primary hover:bg-df-accent text-white px-4 py-2 rounded-lg font-medium transition-colors">Save</button>
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
  if(confirm('Are you sure you want to delete this user?')) {
    await adminService.deleteUser(id)
    loadData()
  }
}
</script>
