<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-df-text">Groups</h1>
        <p class="text-df-text-muted text-sm mt-1">Manage ticket groups and departments</p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-df-primary hover:bg-df-accent text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        New Group
      </button>
    </div>

    <!-- Groups Table -->
    <div class="glass-panel overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/5 text-df-text-muted text-sm">
            <th class="p-4 font-medium w-16">ID</th>
            <th class="p-4 font-medium">Name</th>
            <th class="p-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm text-df-text">
          <tr 
            v-for="group in groups" 
            :key="group.id" 
            class="border-b border-white/5 hover:bg-white/5 transition-colors"
          >
            <td class="p-4 text-df-text-muted">#{{ group.id }}</td>
            <td class="p-4 font-medium">{{ group.name }}</td>
            <td class="p-4 text-right space-x-2">
              <button @click="openModal(group)" class="text-df-primary hover:text-df-accent transition-colors">Edit</button>
              <button @click="deleteGroup(group.id)" class="text-red-400 hover:text-red-300 transition-colors">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/New Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="glass-panel w-full max-w-sm p-6">
        <h2 class="text-xl font-bold text-df-text mb-4">{{ editingGroup ? 'Edit Group' : 'New Group' }}</h2>
        
        <form @submit.prevent="saveGroup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-df-text-muted mb-1">Group Name</label>
            <input v-model="form.name" type="text" required class="w-full bg-df-bg border border-white/10 rounded-lg px-4 py-2 text-df-text focus:outline-none focus:border-df-primary">
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
  if(confirm('Are you sure you want to delete this group?')) {
    await adminService.deleteGroup(id)
    loadData()
  }
}
</script>
