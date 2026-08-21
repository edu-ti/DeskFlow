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

          <div class="border-t border-gray-100 pt-4">
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Chamadas de Voz — Política (LGPD / Retenção)</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Exigir consentimento (LGPD)</label>
                <select v-model="settings.calling_require_consent" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="true">Sim — bloquear chamada de saída sem consentimento</option>
                  <option value="false">Não — apenas permissão da WhatsApp</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Chamadas de saída por agente / 24h</label>
                <input v-model="settings.calling_max_calls_per_day_per_agent" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Chamadas simultâneas (máx.)</label>
                <input v-model="settings.calling_max_concurrent_calls" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Retenção dos logs (dias)</label>
                <input v-model="settings.calling_log_retention_days" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Anonimizar dados sensíveis (dias)</label>
                <input v-model="settings.calling_log_anonymize_days" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <p class="text-[11px] text-gray-400 mt-2">
              A purga automática roda a cada 6h. Chamadas de saída exigem consentimento do cliente (LGPD) e permissão da WhatsApp (limite ≥ 2000 mensagens).
            </p>
          </div>
        </div>
      </div>


      <!-- AI Settings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:col-span-2">
        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50/70 to-indigo-50/70 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <SparklesIcon class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-semibold text-gray-900">Inteligência Artificial & Chatbot</h2>
              <p class="text-xs text-gray-500">Configuração de múltiplos provedores (OpenAI, Gemini, DeepSeek, Claude, Groq, Ollama e Customizado).</p>
            </div>
          </div>
          <button
            type="button"
            @click="testAiConnection"
            :disabled="isTestingAi"
            class="px-3.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Enviar mensagem de teste para o modelo configurado"
          >
            <Loader2Icon v-if="isTestingAi" class="w-3.5 h-3.5 animate-spin" />
            <BotIcon v-else class="w-3.5 h-3.5" />
            <span>{{ isTestingAi ? 'Testando...' : 'Testar Conexão de IA' }}</span>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Provedor de IA -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Provedor de IA</label>
              <select
                v-model="settings.AI_PROVIDER"
                @change="onProviderChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-gray-800"
              >
                <option value="openai">🟢 OpenAI (ChatGPT)</option>
                <option value="gemini">🔵 Google Gemini</option>
                <option value="deepseek">🐋 DeepSeek</option>
                <option value="claude">🟣 Anthropic Claude</option>
                <option value="groq">⚡ Groq (Ultra Rápido)</option>
                <option value="ollama">🦙 Ollama (Local / Gratuito)</option>
                <option value="custom">⚙️ Customizado / OpenAI Compatible</option>
              </select>
              <span class="text-[11px] text-gray-400 mt-1 block">{{ currentProviderInfo.badge }}</span>
            </div>

            <!-- Modelo de IA -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Modelo de IA</label>
              <div v-if="!isCustomModelInput">
                <select
                  v-model="settings.AI_MODEL"
                  @change="onModelSelectChange"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-gray-800"
                >
                  <option v-for="m in currentModels" :key="m.id" :value="m.id">{{ m.label }}</option>
                  <option value="__custom__">✏️ Digitar outro modelo...</option>
                </select>
              </div>
              <div v-else class="flex gap-1.5">
                <input
                  v-model="settings.AI_MODEL"
                  type="text"
                  placeholder="ex: mistral-large-latest"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  type="button"
                  @click="isCustomModelInput = false"
                  class="px-2.5 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  title="Voltar para a lista sugerida"
                >
                  Lista
                </button>
              </div>
              <span class="text-[11px] text-gray-400 mt-1 block">Modelo utilizado para resumos e triagem.</span>
            </div>

            <!-- Chatbot WhatsApp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chatbot no WhatsApp</label>
              <select v-model="settings.AI_BOT_ENABLED" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                <option value="true">Ativado (Auto-resposta e Triagem)</option>
                <option value="false">Desativado (Apenas humano)</option>
              </select>
              <span class="text-[11px] text-gray-400 mt-1 block">Responde automaticamente mensagens iniciais.</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ settings.AI_PROVIDER === 'ollama' ? 'Chave de API (Opcional)' : 'Chave de API (API Key)' }}
              </label>
              <input
                v-model="settings.AI_API_KEY"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                :placeholder="currentProviderInfo.placeholder"
              />
              <span class="text-[11px] text-gray-400 mt-1 block">
                {{ settings.AI_PROVIDER === 'ollama' ? 'Ollama local não exige chave de autenticação.' : 'Deixe em branco para usar o motor heurístico local nativo.' }}
              </span>
            </div>

            <!-- Base URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL Base da API (Base URL)</label>
              <input
                v-model="settings.AI_BASE_URL"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                :placeholder="currentProviderInfo.defaultBaseUrl"
              />
              <span class="text-[11px] text-gray-400 mt-1 block">
                Padrão para {{ currentProviderInfo.name }}: <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{{ currentProviderInfo.defaultBaseUrl }}</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Save as SaveIcon, Loader2 as Loader2Icon, Inbox as InboxIcon, Send as SendIcon, Sparkles as SparklesIcon, Bot as BotIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const isLoading = ref(true)
const isSaving = ref(false)
const isTestingAi = ref(false)
const isCustomModelInput = ref(false)

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
  whatsapp_verify_token: 'deskflow_whatsapp_2026',
  calling_require_consent: 'true',
  calling_max_calls_per_day_per_agent: '50',
  calling_max_concurrent_calls: '5',
  calling_log_retention_days: '90',
  calling_log_anonymize_days: '30',
  AI_PROVIDER: 'openai',
  AI_API_KEY: '',
  AI_BASE_URL: '',
  OPENAI_API_KEY: '',
  AI_MODEL: 'gpt-4o-mini',
  AI_BOT_ENABLED: 'true'
})

interface ProviderMeta {
  id: string
  name: string
  placeholder: string
  badge: string
  defaultBaseUrl: string
  defaultModel: string
  models: { id: string; label: string }[]
}

const providers: Record<string, ProviderMeta> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-proj-••••••••',
    badge: 'GPT-4o, GPT-4o-mini, o3-mini',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini (Recomendado - Rápido & Econômico)' },
      { id: 'gpt-4o', label: 'gpt-4o (Avançado - Máxima Precisão)' },
      { id: 'gpt-4-turbo', label: 'gpt-4-turbo' },
      { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo (Legado)' },
      { id: 'o3-mini', label: 'o3-mini (Raciocínio)' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    placeholder: 'AIzaSy••••••••',
    badge: 'Gemini 2.0 Flash, 1.5 Pro',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: [
      { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Recomendado - Próxima Geração)' },
      { id: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Ultra Rápido)' },
      { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro (Raciocínio Complexo)' },
      { id: 'gemini-2.0-flash-lite-preview-02-05', label: 'gemini-2.0-flash-lite' },
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    placeholder: 'sk-••••••••',
    badge: 'DeepSeek V3, DeepSeek R1',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'deepseek-chat (DeepSeek V3 - Alta Performance & Baixo Custo)' },
      { id: 'deepseek-reasoner', label: 'deepseek-reasoner (DeepSeek R1 - Raciocínio Profundo)' },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    placeholder: 'sk-ant-••••••••',
    badge: 'Claude 3.5 Sonnet, 3.5 Haiku',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'claude-3-5-sonnet (Recomendado - Excelente Redação)' },
      { id: 'claude-3-5-haiku-20241022', label: 'claude-3-5-haiku (Rápido)' },
      { id: 'claude-3-opus-20240229', label: 'claude-3-opus (Máxima Capacidade)' },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    placeholder: 'gsk_••••••••',
    badge: 'Llama 3.3 70B, Mixtral',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Recomendado - Resposta Instantânea)' },
      { id: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (Ultra Leve)' },
      { id: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768' },
      { id: 'gemma2-9b-it', label: 'gemma2-9b-it' },
    ],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    placeholder: 'Ollama local não requer chave',
    badge: '100% Gratuito & Local',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: [
      { id: 'llama3.2', label: 'llama3.2 (Recomendado para DeskFlow local)' },
      { id: 'llama3.1', label: 'llama3.1' },
      { id: 'mistral', label: 'mistral' },
      { id: 'qwen2.5', label: 'qwen2.5' },
      { id: 'phi3', label: 'phi3' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    placeholder: 'Chave ou token de API',
    badge: 'OpenRouter, LiteLLM, vLLM, etc.',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'mistralai/mistral-7b-instruct',
    models: [
      { id: 'mistralai/mistral-7b-instruct', label: 'mistralai/mistral-7b-instruct (OpenRouter)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'meta-llama/llama-3.3-70b-instruct (OpenRouter)' },
      { id: 'custom', label: 'Outro modelo...' },
    ],
  },
}

const currentProviderInfo = computed(() => {
  const p = settings.value.AI_PROVIDER || 'openai'
  return providers[p] || providers.openai
})

const currentModels = computed(() => {
  return currentProviderInfo.value.models
})

const onProviderChange = () => {
  const p = currentProviderInfo.value
  settings.value.AI_MODEL = p.defaultModel
  isCustomModelInput.value = false
}

const onModelSelectChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  if (val === '__custom__') {
    isCustomModelInput.value = true
    settings.value.AI_MODEL = ''
  }
}

onMounted(async () => {
  await fetchSettings()
})

const fetchSettings = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/settings')
    Object.keys(res.data).forEach(key => {
      if (settings.value[key] !== undefined) {
        settings.value[key] = res.data[key]
      }
    })

    // Retrocompatibilidade se só OPENAI_API_KEY estava salvo
    if (!settings.value.AI_API_KEY && settings.value.OPENAI_API_KEY) {
      settings.value.AI_API_KEY = settings.value.OPENAI_API_KEY
    }
  } catch (error) {
    toastError('Erro', 'Não foi possível carregar as configurações.')
  } finally {
    isLoading.value = false
  }
}

const testAiConnection = async () => {
  isTestingAi.value = true
  try {
    const res = await api.post('/ai/test-connection', {
      provider: settings.value.AI_PROVIDER,
      apiKey: settings.value.AI_API_KEY || settings.value.OPENAI_API_KEY,
      baseUrl: settings.value.AI_BASE_URL,
      model: settings.value.AI_MODEL,
    })
    toastSuccess('Conexão com IA OK', `${res.data.message}${res.data.reply ? ` Resposta: "${res.data.reply}"` : ''}`)
  } catch (err: any) {
    toastError('Falha no teste de IA', err?.response?.data?.message || err?.message || 'Não foi possível conectar com o provedor de IA.')
  } finally {
    isTestingAi.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    // Sincroniza OPENAI_API_KEY para compatibilidade
    if (settings.value.AI_PROVIDER === 'openai') {
      settings.value.OPENAI_API_KEY = settings.value.AI_API_KEY
    }
    await api.put('/settings', settings.value)
    toastSuccess('Sucesso', 'Configurações atualizadas com sucesso.')
  } catch (error) {
    toastError('Erro', 'Não foi possível salvar as configurações.')
  } finally {
    isSaving.value = false
  }
}
</script>
