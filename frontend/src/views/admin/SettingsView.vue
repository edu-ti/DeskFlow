<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p class="text-sm text-gray-500 mt-1">Gerencie as credenciais e parâmetros globais do DeskFlow.</p>
      </div>
      <button 
        @click="saveSettings" 
        :disabled="isSaving"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <SaveIcon class="w-4 h-4" />
        {{ isSaving ? 'Salvando...' : 'Salvar Configurações' }}
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- IMAP Settings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <InboxIcon class="w-5 h-5 text-gray-500" />
          <h2 class="font-medium text-gray-900">Recebimento de E-mail (IMAP)</h2>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            Configuração da caixa postal onde o sistema irá ler os e-mails e convertê-los em chamados a cada 5 minutos.
          </p>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Host IMAP</label>
            <input v-model="settings.IMAP_HOST" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ex: imap.gmail.com">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Porta</label>
              <input v-model="settings.IMAP_PORT" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="993">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Usa SSL/TLS?</label>
              <select v-model="settings.IMAP_TLS" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Usuário / E-mail</label>
            <input v-model="settings.IMAP_USER" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="suporte@suaempresa.com">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input v-model="settings.IMAP_PASS" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••">
          </div>
        </div>
      </div>

      <!-- SMTP Settings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <SendIcon class="w-5 h-5 text-gray-500" />
          <h2 class="font-medium text-gray-900">Envio de E-mail (SMTP)</h2>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            Configuração do servidor utilizado para enviar notificações e respostas de chamados para os clientes.
          </p>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Host SMTP</label>
            <input v-model="settings.SMTP_HOST" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ex: smtp.gmail.com">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Porta</label>
              <input v-model="settings.SMTP_PORT" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="465">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Usa SSL/TLS?</label>
              <select v-model="settings.SMTP_SECURE" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail Remetente (FROM)</label>
            <input v-model="settings.SMTP_FROM" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Suporte <suporte@suaempresa.com>">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <input v-model="settings.SMTP_USER" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input v-model="settings.SMTP_PASS" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••">
            </div>
          </div>
        </div>
      </div>

      <!-- WhatsApp Settings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <h2 class="font-medium text-gray-900">WhatsApp (Meta Cloud API)</h2>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            Configuração da API Oficial do WhatsApp para receber mensagens e responder chamados.
          </p>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Token de Acesso (Permanente)</label>
            <input v-model="settings.whatsapp_token" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="EA...XXXX">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ID do Telefone</label>
              <input v-model="settings.whatsapp_phone_id" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1234567890">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Verify Token (Webhook)</label>
              <input v-model="settings.whatsapp_verify_token" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="deskflow_whatsapp_2026">
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Save as SaveIcon, Loader2 as Loader2Icon, Inbox as InboxIcon, Send as SendIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const isLoading = ref(true)
const isSaving = ref(false)

const settings = ref<Record<string, string>>({
  IMAP_HOST: '',
  IMAP_PORT: '993',
  IMAP_TLS: 'true',
  IMAP_USER: '',
  IMAP_PASS: '',
  SMTP_HOST: '',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_FROM: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  whatsapp_token: '',
  whatsapp_phone_id: '',
  whatsapp_verify_token: 'deskflow_whatsapp_2026'
})

onMounted(async () => {
  await fetchSettings()
})

const fetchSettings = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/settings')
    // Merge existing settings into the reactive object
    Object.keys(res.data).forEach(key => {
      if (settings.value[key] !== undefined) {
        settings.value[key] = res.data[key]
      }
    })
  } catch (error) {
    toastError('Erro', 'Não foi possível carregar as configurações.')
  } finally {
    isLoading.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await api.put('/settings', settings.value)
    toastSuccess('Sucesso', 'Configurações de e-mail atualizadas. Elas entrarão em vigor no próximo ciclo (até 5 min).')
  } catch (error) {
    toastError('Erro', 'Não foi possível salvar as configurações.')
  } finally {
    isSaving.value = false
  }
}
</script>
