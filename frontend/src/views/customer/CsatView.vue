<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="inline-flex items-center justify-center p-3 bg-blue-50 text-df-primary rounded-2xl mb-4 shadow-xs">
        <HeartIcon class="w-8 h-8 text-df-primary" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
        Pesquisa de Satisfação
      </h2>
      <p v-if="ticket" class="mt-2 text-sm text-gray-600">
        Avalie sua experiência no chamado <span class="font-bold text-gray-900">#{{ ticket.id }}</span>
        <br/>
        Atendido por <span class="font-semibold text-df-primary">{{ ticket.agent }}</span>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow-sm border border-gray-200/80 rounded-2xl sm:px-10">
        
        <!-- Loading -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-8 gap-3 text-gray-400">
          <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
          <span class="text-sm font-medium">Carregando pesquisa...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-8">
          <div class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircleIcon class="w-6 h-6" />
          </div>
          <h3 class="text-base font-bold text-gray-900 mb-1">Ops! Ocorreu um problema</h3>
          <p class="text-xs text-gray-500">{{ error }}</p>
        </div>

        <!-- Already Answered -->
        <div v-else-if="ticket?.alreadyAnswered" class="text-center py-8">
          <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircleIcon class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Avaliação já enviada</h3>
          <p class="mt-1.5 text-sm text-gray-600">Você avaliou este atendimento com nota <span class="font-bold text-gray-900">{{ ticket.score }}/5 ⭐</span>.</p>
          <p class="mt-4 text-xs text-gray-400">Agradecemos imensamente pela sua colaboração!</p>
        </div>

        <!-- Success Screen -->
        <div v-else-if="success" class="text-center py-8 animate-in fade-in zoom-in-95 duration-200">
          <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircleIcon class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-bold text-gray-900">Muito obrigado!</h3>
          <p class="mt-2 text-sm text-gray-600">Sua avaliação foi registrada com sucesso e nos ajuda a melhorar cada vez mais nosso atendimento.</p>
        </div>

        <!-- Survey Form -->
        <form v-else @submit.prevent="submitForm">
          
          <div class="mb-6 flex flex-col items-center">
            <label class="block text-sm font-semibold text-gray-800 mb-4 text-center">
              Como você avalia a resolução do seu chamado?
            </label>
            
            <!-- Star Rating with Hover and Labels -->
            <div class="flex gap-2">
              <button 
                v-for="star in 5" 
                :key="star"
                type="button"
                @mouseenter="hoverScore = star"
                @mouseleave="hoverScore = 0"
                @click="score = star"
                class="focus:outline-none transition-transform hover:scale-125 p-1"
                :title="`Nota ${star}`"
              >
                <StarIcon 
                  class="w-8 h-8 transition-colors" 
                  :class="(hoverScore >= star || score >= star) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'"
                />
              </button>
            </div>

            <!-- Rating Label Feedback -->
            <p class="mt-3 text-xs font-semibold text-gray-600 h-4">
              {{ getScoreLabel(hoverScore || score) }}
            </p>

            <p v-if="scoreError" class="mt-2 text-xs font-semibold text-red-600">
              Por favor, clique em uma estrela para avaliar.
            </p>
          </div>

          <div class="mb-6">
            <label for="comment" class="block text-xs font-semibold text-gray-700 mb-1">
              Comentário adicional (opcional)
            </label>
            <textarea 
              id="comment" 
              v-model="comment"
              rows="3" 
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" 
              placeholder="Conte-nos o que você achou do atendimento..."
            ></textarea>
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting || score === 0"
            class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-df-primary hover:bg-df-primary-hover focus:outline-none shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span v-else>Enviar Avaliação</span>
          </button>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Heart as HeartIcon, Star as StarIcon, CheckCircle as CheckCircleIcon, AlertCircle as AlertCircleIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
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

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const publicApi = axios.create({
  baseURL: apiUrl
})

onMounted(async () => {
  try {
    const res = await publicApi.get(`/csat/${token}`)
    ticket.value = res.data
    
    if (route.query.score) {
      const qScore = parseInt(route.query.score as string)
      if (qScore >= 1 && qScore <= 5 && !ticket.value.alreadyAnswered) {
        score.value = qScore
      }
    }
  } catch (err: any) {
    if (err.response?.status === 404) {
      error.value = 'Pesquisa de satisfação não encontrada ou token expirado.'
    } else {
      error.value = 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.'
    }
  } finally {
    isLoading.value = false
  }
})

const getScoreLabel = (val: number) => {
  switch (val) {
    case 1: return 'Péssimo 😞'
    case 2: return 'Ruim 🙁'
    case 3: return 'Regular 😐'
    case 4: return 'Bom 😊'
    case 5: return 'Excelente! 🤩'
    default: return ''
  }
}

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
