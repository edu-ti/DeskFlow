<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Organizações</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ filteredOrganizations.length }} {{ filteredOrganizations.length === 1 ? 'organização' : 'organizações' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Cadastre as empresas/órgãos e vincule seus contatos</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center justify-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
      >
        <Building2Icon class="w-4 h-4" />
        <span>Nova Organização</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <SearchIcon class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome, razão social ou CNPJ..."
          class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando organizações...</span>
      </div>

      <div v-else-if="filteredOrganizations.length === 0" class="p-12 text-center text-gray-500">
        <BuildingIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhuma organização encontrada</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200/80 bg-gray-50/60 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-4">Nome</th>
              <th class="py-3.5 px-4">Razão Social</th>
              <th class="py-3.5 px-4">CNPJ</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr
              v-for="org in filteredOrganizations"
              :key="org.id"
              class="hover:bg-blue-50/30 transition-colors group"
            >
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-50 text-df-primary rounded-xl border border-blue-100">
                    <Building2Icon class="w-4 h-4" />
                  </div>
                  <span class="font-semibold text-gray-900">{{ org.name }}</span>
                </div>
              </td>
              <td class="py-3.5 px-4 text-gray-600">{{ org.legal_name || '—' }}</td>
              <td class="py-3.5 px-4 text-gray-600 font-mono text-xs">{{ org.cnpj || '—' }}</td>
              <td class="py-3.5 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                  :class="org.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="org.active !== false ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ org.active !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    @click="openModal(org)"
                    class="p-1.5 text-gray-400 hover:text-df-primary hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Organização"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteOrganization(org.id)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Organização"
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

    <!-- Modal (Create / Edit) -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-df-primary rounded-xl">
              <Building2Icon v-if="!editingOrg" class="w-5 h-5" />
              <PencilIcon v-else class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ editingOrg ? 'Editar Organização' : 'Nova Organização' }}</h2>
              <p class="text-xs text-gray-500">Preencha os dados cadastrais</p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveOrganization" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Nome fantasia"
              class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Razão Social</label>
            <input
              v-model="form.legal_name"
              type="text"
              placeholder="Razão social completa"
              class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">CNPJ</label>
            <input
              v-model="form.cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
            />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-df-primary focus:ring-df-primary/20" />
            Organização ativa
          </label>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" @click="closeModal" class="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ editingOrg ? 'Salvar Alterações' : 'Criar Organização' }}</span>
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
  Building2 as Building2Icon,
  Building as BuildingIcon,
  Search as SearchIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'
import { adminService } from '../../services/adminService'

const organizations = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editingOrg = ref<any>(null)
const searchQuery = ref('')

const form = ref({ name: '', legal_name: '', cnpj: '', active: true })

const loadData = async () => {
  isLoading.value = true
  try {
    organizations.value = (await adminService.getOrganizations()) || []
  } catch (error) {
    console.error('Erro ao carregar organizações:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const filteredOrganizations = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return organizations.value.filter((o) => {
    return (
      (o.name || '').toLowerCase().includes(query) ||
      (o.legal_name || '').toLowerCase().includes(query) ||
      (o.cnpj || '').toLowerCase().includes(query)
    )
  })
})

const openModal = (org?: any) => {
  editingOrg.value = org || null
  if (org) {
    form.value = { name: org.name || '', legal_name: org.legal_name || '', cnpj: org.cnpj || '', active: org.active !== false }
  } else {
    form.value = { name: '', legal_name: '', cnpj: '', active: true }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveOrganization = async () => {
  isSubmitting.value = true
  try {
    if (editingOrg.value) {
      await adminService.updateOrganization(editingOrg.value.id, form.value)
    } else {
      await adminService.createOrganization(form.value)
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('Erro ao salvar organização:', error)
    alert('Erro ao salvar organização.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteOrganization = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir esta organização?')) {
    try {
      await adminService.deleteOrganization(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir organização:', error)
      alert('Não foi possível excluir a organização. Ela pode estar vinculada a contatos.')
    }
  }
}
</script>
