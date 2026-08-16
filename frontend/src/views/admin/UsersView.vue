<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-df-primary rounded-full">
            {{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'usuário' : 'usuários' }}
          </span>
        </div>
        <p class="text-gray-500 text-sm mt-1">Cadastre, edite permissões e organize agentes e clientes por grupos</p>
      </div>
      <button 
        @click="openModal()" 
        class="inline-flex items-center justify-center gap-2 bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
      >
        <UserPlusIcon class="w-4 h-4" />
        <span>Novo Usuário</span>
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <SearchIcon class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por nome ou e-mail..."
          class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
        />
      </div>

      <!-- Role Tabs / Filter -->
      <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <button 
          v-for="filter in roleFilters" 
          :key="filter.value"
          @click="selectedRoleFilter = filter.value"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
          :class="selectedRoleFilter === filter.value 
            ? 'bg-df-primary text-white shadow-sm' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
        <Loader2Icon class="w-6 h-6 animate-spin text-df-primary" />
        <span class="text-sm">Carregando usuários...</span>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="p-12 text-center text-gray-500">
        <UsersIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="font-medium text-gray-700">Nenhum usuário encontrado</p>
        <p class="text-xs text-gray-400 mt-1">Tente ajustar seus filtros ou busca.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200/80 bg-gray-50/60 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-4">Usuário</th>
              <th class="py-3.5 px-4">E-mail</th>
              <th class="py-3.5 px-4">Papéis / Permissões</th>
              <th class="py-3.5 px-4">Grupos</th>
              <th class="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr 
              v-for="user in filteredUsers" 
              :key="user.id" 
              class="hover:bg-blue-50/30 transition-colors group"
            >
              <!-- Name & Avatar -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0"
                    :class="getUserAvatarStyle(user)"
                  >
                    {{ getUserInitials(user) }}
                  </div>
                  <div>
                    <span class="font-semibold text-gray-900 block leading-tight">
                      {{ user.firstname }} {{ user.lastname }}
                    </span>
                    <span class="text-[11px] text-gray-400">ID #{{ user.id }}</span>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="py-3.5 px-4 text-gray-600 font-medium">
                {{ user.email }}
              </td>

              <!-- Roles -->
              <td class="py-3.5 px-4">
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="r in user.roles" 
                    :key="r.id" 
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                    :class="getRoleBadgeStyle(r.name)"
                  >
                    <ShieldIcon v-if="r.name === 'admin'" class="w-3 h-3" />
                    <HeadphonesIcon v-else-if="r.name === 'agent'" class="w-3 h-3" />
                    <UserIcon v-else class="w-3 h-3" />
                    {{ getRoleDisplayName(r.name) }}
                  </span>
                  <span v-if="!user.roles || user.roles.length === 0" class="text-xs text-gray-400 italic">
                    Sem função
                  </span>
                </div>
              </td>

              <!-- Groups -->
              <td class="py-3.5 px-4">
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="g in user.groups" 
                    :key="g.id" 
                    class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200/60"
                  >
                    {{ g.name }}
                  </span>
                  <span v-if="!user.groups || user.groups.length === 0" class="text-xs text-gray-400 italic">
                    Nenhum grupo
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button 
                    @click="openModal(user)" 
                    class="p-1.5 text-gray-400 hover:text-df-primary hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Usuário"
                  >
                    <Edit2Icon class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteUser(user.id)" 
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Usuário"
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

    <!-- User Modal (Create / Edit) -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-df-primary rounded-xl">
              <UserPlusIcon v-if="!editingUser" class="w-5 h-5" />
              <Edit2Icon v-else class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
              <p class="text-xs text-gray-500">{{ editingUser ? 'Atualize os dados e acessos do usuário' : 'Preencha as informações do novo integrante' }}</p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Modal Form -->
        <form @submit.prevent="saveUser" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Nome *</label>
              <input 
                v-model="form.firstname" 
                type="text" 
                required 
                placeholder="Ex: Carlos"
                class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">Sobrenome</label>
              <input 
                v-model="form.lastname" 
                type="text" 
                placeholder="Ex: Silva"
                class="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">E-mail / Login *</label>
            <div class="relative">
              <MailIcon class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                v-model="form.email" 
                type="email" 
                required 
                placeholder="carlos@empresa.com"
                class="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
              />
            </div>
          </div>

          <!-- Password field -->
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
              {{ editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso *' }}
            </label>
            <div class="relative">
              <LockIcon class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                v-model="form.password" 
                type="password" 
                :required="!editingUser"
                placeholder="••••••••"
                class="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-df-primary/20 focus:border-df-primary transition-all"
              />
            </div>
          </div>
          
          <!-- Role Selection Checkboxes -->
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-2">Papéis e Permissões</label>
            <div class="grid grid-cols-1 gap-2">
              <label 
                v-for="r in allRoles" 
                :key="r.id" 
                class="flex items-center p-3 rounded-xl border cursor-pointer transition-all"
                :class="form.roleIds.includes(r.id) ? 'border-df-primary bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'"
              >
                <input 
                  type="checkbox" 
                  :value="r.id" 
                  v-model="form.roleIds"
                  class="w-4 h-4 text-df-primary rounded border-gray-300 focus:ring-df-primary"
                />
                <div class="ml-3">
                  <div class="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <ShieldIcon v-if="r.name === 'admin'" class="w-3.5 h-3.5 text-purple-600" />
                    <HeadphonesIcon v-else-if="r.name === 'agent'" class="w-3.5 h-3.5 text-blue-600" />
                    <UserIcon v-else class="w-3.5 h-3.5 text-emerald-600" />
                    {{ getRoleDisplayName(r.name) }}
                  </div>
                  <div class="text-xs text-gray-500">{{ getRoleDescription(r.name) }}</div>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Groups Selection Tags -->
          <div>
            <label class="block text-xs font-semibold uppercase text-gray-600 mb-2">Grupos de Atendimento</label>
            <div class="flex flex-wrap gap-2">
              <button 
                type="button"
                v-for="g in allGroups" 
                :key="g.id"
                @click="toggleGroup(g.id)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border"
                :class="form.groupIds.includes(g.id) 
                  ? 'bg-df-primary text-white border-df-primary shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'"
              >
                <CheckIcon v-if="form.groupIds.includes(g.id)" class="w-3 h-3" />
                <span v-else class="w-3 h-3 rounded-full border border-gray-400 inline-block"></span>
                {{ g.name }}
              </button>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              @click="closeModal" 
              class="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="bg-df-primary hover:bg-df-primary-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ editingUser ? 'Salvar Alterações' : 'Criar Usuário' }}</span>
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
  UserPlus as UserPlusIcon, 
  Search as SearchIcon, 
  Users as UsersIcon, 
  Shield as ShieldIcon, 
  Headphones as HeadphonesIcon, 
  User as UserIcon, 
  Edit2 as Edit2Icon, 
  Trash2 as Trash2Icon, 
  X as XIcon, 
  Check as CheckIcon, 
  Mail as MailIcon, 
  Lock as LockIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { adminService } from '../../services/adminService'

const users = ref<any[]>([])
const allRoles = ref<any[]>([])
const allGroups = ref<any[]>([])

const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editingUser = ref<any>(null)

const searchQuery = ref('')
const selectedRoleFilter = ref('all')

const roleFilters = [
  { label: 'Todos', value: 'all' },
  { label: 'Administradores', value: 'admin' },
  { label: 'Agentes', value: 'agent' },
  { label: 'Clientes', value: 'customer' }
]

const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  roleIds: [] as number[],
  groupIds: [] as number[]
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [fetchedUsers, fetchedRoles, fetchedGroups] = await Promise.all([
      adminService.getUsers(),
      adminService.getRoles(),
      adminService.getGroups()
    ])
    users.value = fetchedUsers || []
    allRoles.value = fetchedRoles || []
    allGroups.value = fetchedGroups || []
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    // Search query match
    const fullName = `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase()
    const email = (u.email || '').toLowerCase()
    const query = searchQuery.value.toLowerCase()
    const matchesSearch = fullName.includes(query) || email.includes(query)

    // Role filter match
    let matchesRole = true
    if (selectedRoleFilter.value !== 'all') {
      matchesRole = u.roles?.some((r: any) => r.name === selectedRoleFilter.value)
    }

    return matchesSearch && matchesRole
  })
})

const toggleGroup = (groupId: number) => {
  const index = form.value.groupIds.indexOf(groupId)
  if (index >= 0) {
    form.value.groupIds.splice(index, 1)
  } else {
    form.value.groupIds.push(groupId)
  }
}

const getUserInitials = (user: any) => {
  const f = user.firstname ? user.firstname[0] : ''
  const l = user.lastname ? user.lastname[0] : ''
  return (f + l).toUpperCase() || 'U'
}

const getUserAvatarStyle = (user: any) => {
  const isAdmin = user.roles?.some((r: any) => r.name === 'admin')
  const isAgent = user.roles?.some((r: any) => r.name === 'agent')
  if (isAdmin) return 'bg-purple-100 text-purple-700 border border-purple-200'
  if (isAgent) return 'bg-blue-100 text-blue-700 border border-blue-200'
  return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
}

const getRoleDisplayName = (roleName: string) => {
  switch (roleName) {
    case 'admin': return 'Administrador'
    case 'agent': return 'Agente'
    case 'customer': return 'Cliente'
    default: return roleName
  }
}

const getRoleDescription = (roleName: string) => {
  switch (roleName) {
    case 'admin': return 'Acesso irrestrito a configurações, relatórios e gestão.'
    case 'agent': return 'Pode atender chamados, gerenciar clientes e responder tickets.'
    case 'customer': return 'Abre e acompanha seus próprios chamados pelo portal.'
    default: return ''
  }
}

const getRoleBadgeStyle = (roleName: string) => {
  switch (roleName) {
    case 'admin': return 'bg-purple-100 text-purple-700 border border-purple-200'
    case 'agent': return 'bg-blue-100 text-df-primary border border-blue-200'
    case 'customer': return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    default: return 'bg-gray-100 text-gray-700 border border-gray-200'
  }
}

const openModal = (user?: any) => {
  editingUser.value = user || null
  if (user) {
    form.value = {
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      password: '',
      roleIds: user.roles?.map((r: any) => r.id) || [],
      groupIds: user.groups?.map((g: any) => g.id) || []
    }
  } else {
    // Default to 'customer' role if exists, or agent
    const defaultRole = allRoles.value.find(r => r.name === 'customer') || allRoles.value[0]
    form.value = {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      roleIds: defaultRole ? [defaultRole.id] : [],
      groupIds: []
    }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveUser = async () => {
  isSubmitting.value = true
  try {
    const payload: any = { ...form.value, login: form.value.email }
    payload.roles = form.value.roleIds.map(id => ({ id }))
    payload.groups = form.value.groupIds.map(id => ({ id }))
    
    if (editingUser.value) {
      if (!payload.password) {
        delete payload.password
      }
      await adminService.updateUser(editingUser.value.id, payload)
    } else {
      await adminService.createUser(payload)
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('Erro ao salvar usuário:', error)
    alert('Erro ao salvar usuário. Verifique se o e-mail já não está cadastrado.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteUser = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir este usuário?')) {
    try {
      await adminService.deleteUser(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Não foi possível excluir o usuário.')
    }
  }
}
</script>
