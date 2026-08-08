<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6 flex items-center gap-4">
      <router-link to="/portal" class="text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Novo Chamado</h1>
        <p class="text-sm text-gray-500 mt-1">Como podemos te ajudar hoje?</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <form @submit.prevent="submitTicket" class="space-y-6">
        
        <!-- Subject -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Assunto <span class="text-red-500">*</span></label>
          <input 
            type="text" 
            id="title" 
            v-model="form.title" 
            required
            placeholder="Ex: Problema com acesso ao sistema"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          >
        </div>

        <!-- Initial Message -->
        <div>
          <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Mensagem <span class="text-red-500">*</span></label>
          <p class="text-xs text-gray-500 mb-2">Descreva detalhadamente o que você precisa ou o problema que está enfrentando.</p>
          <textarea 
            id="message" 
            v-model="form.initial_article_body" 
            rows="6"
            required
            placeholder="Olá, gostaria de relatar que..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-y"
          ></textarea>
        </div>

        <!-- Submit -->
        <div class="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <SendIcon v-else class="w-4 h-4" />
            Enviar Chamado
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft as ArrowLeftIcon, Send as SendIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success, error: toastError } = useToast()

const isSubmitting = ref(false)

const form = ref({
  title: '',
  initial_article_body: '',
  group_id: 1, // Default group for customer portal if none provided
  priority_id: 2, // Normal priority by default
})

const submitTicket = async () => {
  isSubmitting.value = true
  try {
    await api.post('/tickets', form.value)
    success('Sucesso', 'Seu chamado foi criado e em breve será respondido.')
    router.push('/portal')
  } catch (err: any) {
    toastError('Erro', 'Ocorreu um erro ao criar o chamado. Tente novamente.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
