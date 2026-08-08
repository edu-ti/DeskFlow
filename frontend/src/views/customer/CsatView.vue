<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center text-blue-600 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-center text-3xl font-extrabold text-gray-900">
        Pesquisa de Satisfação
      </h2>
      <p v-if="ticket" class="mt-2 text-center text-sm text-gray-600">
        Avalie o atendimento do chamado <span class="font-bold text-gray-900">#{{ ticket.id }} ({{ ticket.title }})</span>
        <br/>
        Atendido por <span class="font-medium text-gray-900">{{ ticket.agent }}</span>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        
        <div v-if="isLoading" class="flex justify-center py-8">
          <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>

        <div v-else-if="error" class="text-center py-8 text-red-600">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="ticket?.alreadyAnswered" class="text-center py-8">
          <div class="flex justify-center mb-4">
            <svg class="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-gray-900">Pesquisa já respondida</h3>
          <p class="mt-2 text-gray-600">Você avaliou este atendimento com {{ ticket.score }} estrela(s).</p>
          <p class="mt-4 text-sm text-gray-500">Muito obrigado pelo seu feedback!</p>
        </div>

        <div v-else-if="success" class="text-center py-8">
          <div class="flex justify-center mb-4">
            <svg class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-gray-900">Muito obrigado!</h3>
          <p class="mt-2 text-gray-600">Sua avaliação foi registrada com sucesso.</p>
        </div>

        <form v-else @submit.prevent="submitForm">
          
          <div class="mb-6 flex flex-col items-center">
            <label class="block text-sm font-medium text-gray-700 mb-4">Sua nota para o atendimento:</label>
            <div class="flex gap-2">
              <button 
                v-for="star in 5" 
                :key="star"
                type="button"
                @mouseenter="hoverScore = star"
                @mouseleave="hoverScore = 0"
                @click="score = star"
                class="focus:outline-none transition-transform hover:scale-110"
              >
                <svg 
                  class="w-10 h-10 transition-colors" 
                  :class="(hoverScore >= star || score >= star) ? 'text-yellow-400' : 'text-gray-300'"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </div>
            <p v-if="scoreError" class="mt-2 text-sm text-red-600">Por favor, selecione uma nota.</p>
          </div>

          <div class="mb-6">
            <label for="comment" class="block text-sm font-medium text-gray-700">Comentário (opcional)</label>
            <div class="mt-1">
              <textarea 
                id="comment" 
                v-model="comment"
                rows="3" 
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border outline-none" 
                placeholder="Como podemos melhorar?"
              ></textarea>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <span v-if="isSubmitting">Enviando...</span>
              <span v-else>Enviar Avaliação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// Como não temos token JWT para essa rota pública, usamos fetch nativo ou uma instância axios sem interceptor que reseta o app
import axios from 'axios'

const route = useRoute()
const token = route.params.token as string

const isLoading = ref(true)
const error = ref('')
const ticket = ref<any>(null)

const score = ref(0)
const hoverScore = ref(0)
const comment = ref('')
const scoreError = ref(false)

const isSubmitting = ref(false)
const success = ref(false)

// Criar instancia axios limpa para endpoints publicos
const publicApi = axios.create({
  baseURL: 'http://localhost:3000'
})

onMounted(async () => {
  try {
    const res = await publicApi.get(`/csat/${token}`)
    ticket.value = res.data
    
    // Auto-select score from URL query params (e.g. ?score=5 from email)
    if (route.query.score) {
      const qScore = parseInt(route.query.score as string)
      if (qScore >= 1 && qScore <= 5 && !ticket.value.alreadyAnswered) {
        score.value = qScore
      }
    }
  } catch (err: any) {
    if (err.response?.status === 404) {
      error.value = 'Pesquisa de satisfação inválida ou não encontrada.'
    } else {
      error.value = 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.'
    }
  } finally {
    isLoading.value = false
  }
})

const submitForm = async () => {
  if (score.value === 0) {
    scoreError.value = true
    return
  }
  
  scoreError.value = false
  isSubmitting.value = true
  
  try {
    await publicApi.post(`/csat/${token}`, {
      score: score.value,
      comment: comment.value
    })
    success.value = true
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao enviar avaliação.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
