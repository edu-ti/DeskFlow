<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Contatos</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ filteredContacts.length }} {{ filteredContacts.length === 1 ? 'contato' : 'contatos' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Gerencie os contatos vinculados às organizações</p>
      </div>
      <button
        @click="openModal(null, 'create')"
        class="inline-flex items-center justify-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
      >
        <UserPlusIcon class="w-4 h-4" />
        <span>Novo Contato</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      <div class="relative w-full sm:w-96">
        <SearchIcon class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome, e-mail, cargo ou organização..."
          class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
        />
      </div>
    </div>

    <!-- Contacts Table -->
    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando contatos...</span>
      </div>

      <div v-else-if="filteredContacts.length === 0" class="p-12 text-center text-gray-500">
        <UsersIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhum contato encontrado</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200/80 bg-gray-50/60 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-4">Nome</th>
              <th class="py-3.5 px-4">Email</th>
              <th class="py-3.5 px-4">Telefone</th>
              <th class="py-3.5 px-4">Cargo</th>
              <th class="py-3.5 px-4">Departamento</th>
              <th class="py-3.5 px-4">Unidade</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr v-for="contact in filteredContacts" :key="contact.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                    {{ getInitials(contact) }}
                  </div>
                  <div>
                    <span class="font-semibold text-gray-900 block leading-tight">{{ getFullName(contact) }}</span>
                    <span v-if="contact.organization" class="text-xs text-gray-400">{{ contact.organization.name }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-4 text-gray-600">{{ contact.email }}</td>
              <td class="py-3.5 px-4 text-gray-500">{{ contact.phone || '—' }}</td>
              <td class="py-3.5 px-4 text-gray-600">{{ contact.job_title || '—' }}</td>
              <td class="py-3.5 px-4 text-gray-600">{{ contact.department || '—' }}</td>
              <td class="py-3.5 px-4 text-gray-600">{{ contact.unit || '—' }}</td>
              <td class="py-3.5 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                  :class="contact.is_active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="contact.is_active !== false ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ contact.is_active !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right relative">
                <button
                  @click.stop="toggleMenu(contact.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Ações
                  <ChevronDownIcon class="w-3.5 h-3.5" />
                </button>
                <div
                  v-if="menuOpenId === contact.id"
                  class="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden text-left"
                >
                  <button @click="openModal(contact, 'config')" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                    <SettingsIcon class="w-4 h-4 text-gray-400" /> Configuração
                  </button>
                  <button @click="openModal(contact, 'edit')" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                    <PencilIcon class="w-4 h-4 text-gray-400" /> Editar
                  </button>
                  <button @click="toggleActive(contact)" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors" :class="contact.is_active !== false ? 'text-red-600' : 'text-emerald-600'">
                    <BanIcon v-if="contact.is_active !== false" class="w-4 h-4" />
                    <CheckIcon v-else class="w-4 h-4" />
                    {{ contact.is_active !== false ? 'Desativar contato' : 'Ativar contato' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal (Create / Edit / Config) -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-df-primary rounded-xl">
              <UserPlusIcon v-if="modalMode === 'create'" class="w-5 h-5" />
              <PencilIcon v-else-if="modalMode === 'edit'" class="w-5 h-5" />
              <SettingsIcon v-else class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ modalTitle }}</h2>
              <p class="text-xs text-gray-500">Preencha as informações do contato</p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveContact" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <template v-if="modalMode !== 'config'">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome *</label>
              <input v-model="form.name" type="text" required placeholder="Nome do contato" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Email *</label>
              <input v-model="form.email" type="email" required placeholder="contato@empresa.com" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Telefone</label>
              <input v-model="form.phone" type="text" placeholder="(00) 00000-0000" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
            </div>
          </template>

          <template v-if="modalMode !== 'edit'">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Organização</label>
              <select v-model="form.organization_id" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all">
                <option :value="null">— Sem organização —</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Cargo</label>
              <input v-model="form.job_title" type="text" placeholder="Ex: Analista de Suporte" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Departamento</label>
                <input v-model="form.department" type="text" placeholder="Ex: TI" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Unidade</label>
                <input v-model="form.unit" type="text" placeholder="Ex: Matriz" class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all" />
              </div>
            </div>
          </template>

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-df-primary focus:ring-df-primary/20" />
            Contato ativo
          </label>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" @click="closeModal" class="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" :disabled="isSubmitting" class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2">
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
import {
  Users as UsersIcon,
  UserPlus as UserPlusIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Pencil as PencilIcon,
  Ban as BanIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  X as XIcon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'
import { adminService } from '../services/adminService'

const contacts = ref<any[]>([])
const organizations = ref<any[]>([])
const customerRoleId = ref<number | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit' | 'config'>('create')
const editingContact = ref<any>(null)
const menuOpenId = ref<number | null>(null)
const searchQuery = ref('')

const form = ref({
  name: '',
  email: '',
  phone: '',
  job_title: '',
  department: '',
  unit: '',
  organization_id: null as number | null,
  active: true
})

const modalTitle = computed(() => {
  switch (modalMode.value) {
    case 'create': return 'Novo Contato'
    case 'edit': return 'Editar Contato'
    case 'config': return 'Configurar Contato'
  }
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [users, orgs, roles] = await Promise.all([
      adminService.getUsers(),
      adminService.getOrganizations(),
      adminService.getRoles()
    ])
    contacts.value = (users || []).filter((u: any) => u.roles?.some((r: any) => r.name === 'customer'))
    organizations.value = orgs || []
    const customerRole = (roles || []).find((r: any) => r.name === 'customer')
    customerRoleId.value = customerRole ? customerRole.id : null
  } catch (error) {
    console.error('Erro ao carregar contatos:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const filteredContacts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return contacts.value.filter((c) => {
    const name = getFullName(c).toLowerCase()
    const email = (c.email || '').toLowerCase()
    const job = (c.job_title || '').toLowerCase()
    const org = (c.organization?.name || '').toLowerCase()
    return name.includes(query) || email.includes(query) || job.includes(query) || org.includes(query)
  })
})

const getFullName = (c: any) => [c.firstname, c.lastname].filter(Boolean).join(' ')

const getInitials = (c: any) => {
  const f = c.firstname ? c.firstname[0] : ''
  const l = c.lastname ? c.lastname[0] : ''
  return (f + l).toUpperCase() || 'C'
}

const toggleMenu = (id: number) => {
  menuOpenId.value = menuOpenId.value === id ? null : id
}

const openModal = (contact: any, mode: 'create' | 'edit' | 'config') => {
  menuOpenId.value = null
  modalMode.value = mode
  editingContact.value = contact
  if (contact) {
    form.value = {
      name: contact.firstname || '',
      email: contact.email || '',
      phone: contact.phone || '',
      job_title: contact.job_title || '',
      department: contact.department || '',
      unit: contact.unit || '',
      organization_id: contact.organization_id ?? contact.organization?.id ?? null,
      active: contact.is_active !== false
    }
  } else {
    form.value = {
      name: '',
      email: '',
      phone: '',
      job_title: '',
      department: '',
      unit: '',
      organization_id: null,
      active: true
    }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveContact = async () => {
  isSubmitting.value = true
  try {
    const payload: any = {
      firstname: form.value.name,
      email: form.value.email,
      phone: form.value.phone || undefined,
      job_title: form.value.job_title || undefined,
      department: form.value.department || undefined,
      unit: form.value.unit || undefined,
      organization_id: form.value.organization_id ?? undefined,
      is_active: form.value.active
    }
    if (editingContact.value) {
      await adminService.updateUser(editingContact.value.id, payload)
    } else {
      payload.login = form.value.email
      if (customerRoleId.value) {
        payload.roles = [{ id: customerRoleId.value }]
      }
      await adminService.createUser(payload)
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('Erro ao salvar contato:', error)
    alert('Erro ao salvar contato.')
  } finally {
    isSubmitting.value = false
  }
}

const toggleActive = async (contact: any) => {
  menuOpenId.value = null
  try {
    await adminService.updateUser(contact.id, { is_active: contact.is_active === false })
    await loadData()
  } catch (error) {
    console.error('Erro ao alterar status do contato:', error)
    alert('Erro ao alterar status do contato.')
  }
}
</script>
