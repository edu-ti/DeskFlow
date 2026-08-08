<template>
  <div class="max-w-3xl mx-auto pb-12">
    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
    </div>

    <div v-else-if="!article" class="text-center py-12 bg-white rounded-xl border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">Artigo não encontrado</h3>
      <p class="text-gray-500 mt-1">Este artigo pode ter sido removido ou o acesso é restrito.</p>
      <router-link to="/portal/kb" class="mt-4 inline-block text-blue-600 hover:underline">Ir para a Base de Conhecimento</router-link>
    </div>

    <div v-else>
      <!-- Breadcrumb -->
      <nav class="flex text-sm text-gray-500 mb-8 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
        <router-link to="/portal/kb" class="hover:text-blue-600 transition-colors">Base de Conhecimento</router-link>
        <span class="mx-2 text-gray-400">/</span>
        <router-link v-if="article.category" :to="'/portal/kb/categories/' + article.category_id" class="hover:text-blue-600 transition-colors">
          {{ article.category.name }}
        </router-link>
        <span v-if="article.category" class="mx-2 text-gray-400">/</span>
        <span class="text-gray-900 truncate">{{ article.title }}</span>
      </nav>

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="p-8 border-b border-gray-100 bg-gray-50/50">
          <h1 class="text-3xl font-bold text-gray-900 mb-4 leading-tight">{{ article.title }}</h1>
          <div class="flex items-center text-sm text-gray-500 gap-4">
            <div class="flex items-center gap-1.5" title="Autor">
              <UserIcon class="w-4 h-4" />
              <span>{{ article.author?.firstname || 'Autor desconhecido' }}</span>
            </div>
            <div class="flex items-center gap-1.5" title="Última atualização">
              <ClockIcon class="w-4 h-4" />
              <span>Atualizado em {{ formatDate(article.updated_at || article.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8 prose prose-blue max-w-none text-gray-800">
          <div v-html="article.content"></div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="mt-8 flex justify-between items-center bg-gray-50 rounded-xl p-6 border border-gray-200">
        <p class="text-gray-600 font-medium">Isso respondeu sua pergunta?</p>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none">
            Sim
          </button>
          <button class="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none">
            Não
          </button>
        </div>
      </div>
      
      <div class="mt-6 text-center">
        <p class="text-gray-500 text-sm">Ainda precisa de ajuda?</p>
        <router-link to="/portal/new" class="mt-2 inline-block text-blue-600 font-medium hover:underline">Abra um chamado</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2 as Loader2Icon, User as UserIcon, Clock as ClockIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { error: toastError } = useToast()

const articleId = route.params.id as string
const isLoading = ref(true)
const article = ref<any>(null)

onMounted(async () => {
  await fetchArticle()
})

const fetchArticle = async () => {
  isLoading.value = true
  try {
    const res = await api.get(`/kb/articles/${articleId}`)
    article.value = res.data
  } catch (err: any) {
    toastError('Erro', 'Não foi possível carregar o artigo.')
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
</script>
