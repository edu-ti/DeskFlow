<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-12">
    <!-- Header Page -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p class="text-sm text-gray-500 mt-1">Gerencie suas informações pessoais, foto de perfil e credenciais de acesso.</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link
          to="/dashboard"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          Voltar
        </router-link>
        <button
          @click="saveProfile"
          :disabled="isSaving"
          class="px-5 py-2 text-sm font-semibold text-white bg-df-primary hover:bg-df-primary-hover rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
        >
          <Loader2Icon v-if="isSaving" class="w-4 h-4 animate-spin" />
          <SaveIcon v-else class="w-4 h-4" />
          <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <Loader2Icon class="w-10 h-10 text-df-primary animate-spin" />
    </div>

    <div v-else class="space-y-6">
      <!-- Profile Hero Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div class="h-32 bg-gradient-to-r from-df-primary via-indigo-600 to-df-accent relative overflow-hidden">
          <div class="absolute inset-0 bg-black/10"></div>
          <div class="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
        </div>

        <div class="px-8 pb-6 pt-0 relative">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 gap-4">
            <!-- Avatar & Main Info -->
            <div class="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div class="relative group">
                <div
                  class="w-28 h-28 rounded-2xl bg-gradient-to-tr from-df-primary to-df-accent border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden bg-cover bg-center"
                  :style="form.avatar_url ? { backgroundImage: `url(${form.avatar_url})` } : {}"
                >
                  <span v-if="!form.avatar_url">{{ userInitials }}</span>
                </div>

                <!-- Botão de Upload de Foto -->
                <label
                  class="absolute inset-0 rounded-2xl bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-medium gap-1"
                  title="Clique para alterar a foto"
                >
                  <CameraIcon class="w-6 h-6" />
                  <span>Alterar</span>
                  <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
                </label>

                <!-- Remover foto se existir -->
                <button
                  v-if="form.avatar_url"
                  @click="removeAvatar"
                  type="button"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
                  title="Remover foto"
                >
                  <XIcon class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="space-y-1">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 class="text-2xl font-bold text-gray-900 leading-tight">
                    {{ form.firstname }} {{ form.lastname }}
                  </h2>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                    :class="isAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'"
                  >
                    {{ roleLabel }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ativo
                  </span>
                </div>
                <p class="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-3">
                  <span>@{{ userProfile?.login || 'usuario' }}</span>
                  <span>•</span>
                  <span>{{ form.email }}</span>
                </p>
              </div>
            </div>

            <!-- Meta Quick Badges -->
            <div class="flex flex-wrap justify-center sm:justify-end gap-2 text-xs text-gray-500">
              <div v-if="userProfile?.created_at" class="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-1.5">
                <CalendarIcon class="w-3.5 h-3.5 text-gray-400" />
                <span>Membro desde {{ formatDate(userProfile.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-gray-200 gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="pb-3 text-sm font-semibold transition-all relative flex items-center gap-2"
          :class="activeTab === tab.id ? 'text-df-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
          <span
            v-if="activeTab === tab.id"
            class="absolute bottom-0 inset-x-0 h-0.5 bg-df-primary rounded-full"
          ></span>
        </button>
      </div>

      <!-- TAB 1: Dados Pessoais & Contato -->
      <div v-if="activeTab === 'personal'" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
        <!-- Card: Identificação -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:col-span-2 space-y-6">
          <div class="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-gray-900">Informações Pessoais</h3>
              <p class="text-xs text-gray-500 mt-0.5">Atualize seus dados de exibição e contato no sistema.</p>
            </div>
            <UserIcon class="w-5 h-5 text-gray-400" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Primeiro Nome *</label>
              <input
                v-model="form.firstname"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="ex: Carlos"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Sobrenome *</label>
              <input
                v-model="form.lastname"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="ex: Silva"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">E-mail Profissional *</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="carlos@empresa.com"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Telefone / WhatsApp</label>
              <input
                v-model="form.phone"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="5511999998888"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Cargo / Função</label>
              <input
                v-model="form.job_title"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="ex: Analista de Suporte N2"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Departamento</label>
              <input
                v-model="form.department"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="ex: Tecnologia da Informação"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Unidade / Filial</label>
              <input
                v-model="form.unit"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none transition-all"
                placeholder="ex: Matriz São Paulo"
              />
            </div>
          </div>
        </div>

        <!-- Card Lateral: Atribuições & Grupos -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div class="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-900">Perfis & Acesso</h3>
              <ShieldCheckIcon class="w-4 h-4 text-emerald-600" />
            </div>

            <div>
              <p class="text-xs text-gray-500 mb-2">Papéis de Acesso (Roles):</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="r in userProfile?.roles || []"
                  :key="r.id"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200"
                >
                  {{ r.name.toUpperCase() }}
                </span>
                <span v-if="!(userProfile?.roles?.length)" class="text-xs text-gray-400">Nenhum papel atribuído</span>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-3">
              <p class="text-xs text-gray-500 mb-2">Filas & Grupos de Atendimento:</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="g in userProfile?.groups || []"
                  :key="g.id"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {{ g.name }}
                </span>
                <span v-if="!(userProfile?.groups?.length)" class="text-xs text-gray-400">Sem grupos vinculados</span>
              </div>
            </div>

            <div v-if="userProfile?.organization" class="border-t border-gray-100 pt-3">
              <p class="text-xs text-gray-500 mb-1">Organização:</p>
              <p class="text-xs font-semibold text-gray-800">{{ userProfile.organization.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Segurança & Senha -->
      <div v-if="activeTab === 'security'" class="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 animate-in fade-in duration-150">
        <div class="border-b border-gray-100 pb-4 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-gray-900">Alterar Senha de Acesso</h3>
            <p class="text-xs text-gray-500 mt-0.5">Recomendamos utilizar uma senha forte com no mínimo 6 caracteres, letras e números.</p>
          </div>
          <KeyRoundIcon class="w-5 h-5 text-gray-400" />
        </div>

        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">Senha Atual *</label>
            <input
              v-model="passwordForm.current_password"
              type="password"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none"
              placeholder="Digite sua senha atual"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Nova Senha *</label>
              <input
                v-model="passwordForm.new_password"
                type="password"
                required
                minlength="6"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Confirmar Nova Senha *</label>
              <input
                v-model="passwordForm.confirm_password"
                type="password"
                required
                minlength="6"
                class="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-df-primary focus:border-transparent outline-none"
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <div class="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <p class="font-semibold flex items-center gap-1.5">
              <ShieldAlertIcon class="w-4 h-4 text-amber-600" />
              Importante:
            </p>
            <p>Após atualizar a senha, sua sessão continuará ativa neste dispositivo, mas novas tentativas de login exigirão a nova senha.</p>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              :disabled="isChangingPassword"
              class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Loader2Icon v-if="isChangingPassword" class="w-4 h-4 animate-spin" />
              <LockIcon v-else class="w-4 h-4" />
              <span>{{ isChangingPassword ? 'Atualizando Senha...' : 'Confirmar Nova Senha' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 3: Preferências & Notificações -->
      <div v-if="activeTab === 'preferences'" class="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 animate-in fade-in duration-150">
        <div class="border-b border-gray-100 pb-4 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-gray-900">Preferências do Usuário</h3>
            <p class="text-xs text-gray-500 mt-0.5">Personalize a experiência de uso do DeskFlow.</p>
          </div>
          <BellIcon class="w-5 h-5 text-gray-400" />
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <div>
              <p class="text-sm font-semibold text-gray-800">Som de Notificação de Chamadas</p>
              <p class="text-xs text-gray-500">Tocar alerta sonoro ao receber uma nova chamada de voz do WhatsApp.</p>
            </div>
            <input type="checkbox" checked class="w-5 h-5 text-df-primary rounded focus:ring-df-primary" />
          </div>

          <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <div>
              <p class="text-sm font-semibold text-gray-800">Notificações no Navegador</p>
              <p class="text-xs text-gray-500">Exibir popups flutuantes quando novos chamados forem atribuídos a você.</p>
            </div>
            <input type="checkbox" checked class="w-5 h-5 text-df-primary rounded focus:ring-df-primary" />
          </div>

          <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <div>
              <p class="text-sm font-semibold text-gray-800">Visualização Compacta</p>
              <p class="text-xs text-gray-500">Reduzir espaçamento nas listas de chamados para exibir mais informações na tela.</p>
            </div>
            <input type="checkbox" class="w-5 h-5 text-df-primary rounded focus:ring-df-primary" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  User as UserIcon,
  ShieldCheck as ShieldCheckIcon,
  KeyRound as KeyRoundIcon,
  Lock as LockIcon,
  Bell as BellIcon,
  Save as SaveIcon,
  Camera as CameraIcon,
  X as XIcon,
  Calendar as CalendarIcon,
  Loader2 as Loader2Icon,
  ShieldAlert as ShieldAlertIcon
} from 'lucide-vue-next'
import { iamService, type UserProfile } from '@/services/iamService'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const activeTab = ref('personal')
const isLoading = ref(true)
const isSaving = ref(false)
const isChangingPassword = ref(false)

const userProfile = ref<UserProfile | null>(null)

const tabs = [
  { id: 'personal', label: 'Dados Pessoais & Contato', icon: UserIcon },
  { id: 'security', label: 'Segurança & Senha', icon: LockIcon },
  { id: 'preferences', label: 'Preferências & Notificações', icon: BellIcon },
]

const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  job_title: '',
  department: '',
  unit: '',
  avatar_url: '' as string | null,
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const userInitials = computed(() => {
  const f = form.value.firstname || userProfile.value?.firstname || 'A'
  const l = form.value.lastname || userProfile.value?.lastname || 'D'
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase()
})

const isAdmin = computed(() => {
  return userProfile.value?.roles?.some(r => r.name === 'admin') || false
})

const roleLabel = computed(() => {
  if (isAdmin.value) return 'Administrador'
  if (userProfile.value?.roles?.some(r => r.name === 'agent')) return 'Agente de Suporte'
  return 'Usuário'
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

const loadProfile = async () => {
  isLoading.value = true
  try {
    const data = await iamService.getProfile()
    userProfile.value = data
    form.value = {
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      email: data.email || '',
      phone: data.phone || '',
      job_title: data.job_title || '',
      department: data.department || '',
      unit: data.unit || '',
      avatar_url: data.avatar_url || null,
    }
  } catch (err: any) {
    toastError('Erro', 'Não foi possível carregar os dados do seu perfil.')
  } finally {
    isLoading.value = false
  }
}

const handleAvatarUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  const file = input.files[0]
  if (file.size > 2 * 1024 * 1024) {
    toastError('Arquivo muito grande', 'A imagem deve ter no máximo 2MB.')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    form.value.avatar_url = reader.result as string
    toastSuccess('Foto Selecionada', 'Clique em Salvar Alterações para confirmar.')
  }
  reader.readAsDataURL(file)
}

const removeAvatar = () => {
  form.value.avatar_url = null
  toastSuccess('Foto Removida', 'Clique em Salvar Alterações para confirmar.')
}

const syncLocalStorageUser = (updatedUser: any) => {
  try {
    const raw = localStorage.getItem('user')
    if (raw) {
      const user = JSON.parse(raw)
      const merged = {
        ...user,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        avatar_url: updatedUser.avatar_url,
      }
      localStorage.setItem('user', JSON.stringify(merged))
      // Dispara evento customizado para layouts atualizarem reativamente
      window.dispatchEvent(new Event('user-profile-updated'))
    }
  } catch (e) {
    /* noop */
  }
}

const saveProfile = async () => {
  if (!form.value.firstname.trim() || !form.value.email.trim()) {
    toastError('Campos obrigatórios', 'Por favor, preencha nome e e-mail.')
    return
  }

  isSaving.value = true
  try {
    const updated = await iamService.updateProfile({
      firstname: form.value.firstname,
      lastname: form.value.lastname,
      email: form.value.email,
      phone: form.value.phone || null,
      job_title: form.value.job_title || null,
      department: form.value.department || null,
      unit: form.value.unit || null,
      avatar_url: form.value.avatar_url,
    })

    userProfile.value = updated
    syncLocalStorageUser(updated)
    toastSuccess('Perfil Atualizado', 'Suas informações foram salvas com sucesso!')
  } catch (err: any) {
    toastError('Erro ao salvar', err?.response?.data?.message || err?.message || 'Falha ao atualizar perfil.')
  } finally {
    isSaving.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    toastError('Senhas divergentes', 'A nova senha e a confirmação não coincidem.')
    return
  }

  isChangingPassword.value = true
  try {
    await iamService.changePassword(
      passwordForm.value.current_password,
      passwordForm.value.new_password
    )
    toastSuccess('Sucesso', 'Sua senha foi alterada com sucesso!')
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: '',
    }
  } catch (err: any) {
    toastError('Erro ao alterar senha', err?.response?.data?.message || 'Verifique a senha atual e tente novamente.')
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>
