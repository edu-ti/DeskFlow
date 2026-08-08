<template>
  <div class="max-w-4xl mx-auto">
    <!-- Breadcrumb -->
    <nav class="flex text-sm text-gray-500 mb-6 font-medium">
      <router-link to="/portal/kb" class="hover:text-blue-600 transition-colors">Base de Conhecimento</router-link>
      <span class="mx-2 text-gray-400">/</span>
      <span class="text-gray-900">{{ category?.name || 'Carregando...' }}</span>
    </nav>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
    </div>

    <div v-else-if="!category" class="text-center py-12 bg-white rounded-xl border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">Categoria não encontrada</h3>
      <p class="text-gray-500 mt-1">A categoria que você tentou acessar não existe ou está restrita.</p>
      <router-link to="/portal/kb" class="mt-4 inline-block text-blue-600 hover:underline">Voltar para o início</router-link>
    </div>

    <div v-else>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ category.name }}</h1>
        <p class="text-lg text-gray-500">{{ category.description }}</p>
      </div>

      <div v-if="articles.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
        <InboxIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900">Nenhum artigo</h3>
        <p class="text-gray-500 mt-1">Esta categoria ainda não possui artigos publicados.</p>
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul class="divide-y divide-gray-100">
          <li v-for="article in articles" :key="article.id">
            <router-link 
              :to="'/portal/kb/articles/' + article.id" 
              class="flex items-center justify-between p-6 hover:bg-blue-50 transition-colors group"
            >
              <div class="flex items-start gap-4">
                <FileTextIcon class="w-6 h-6 text-gray-400 mt-0.5 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                <div>
                  <h3 class="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{{ article.title }}</h3>
                  <p class="text-sm text-gray-500 mt-1 line-clamp-1" v-html="stripHtml(article.content)"></p>
                </div>
              </div>
              <ChevronRightIcon class="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2 as Loader2Icon, Inbox as InboxIcon, FileText as FileTextIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { error: toastError } = useToast()

const categoryId = route.params.id as string
const isLoading = ref(true)
const category = ref<any>(null)
const articles = ref<any[]>([])

onMounted(async () => {
  await fetchCategoryAndArticles()
})

const fetchCategoryAndArticles = async () => {
  isLoading.value = true
  try {
    // 1. We need the category details. Since there isn't a specific GET /kb/categories/:id public endpoint,
    // we can fetch all categories and filter.
    const catsRes = await api.get('/kb/categories')
    category.value = catsRes.data.find((c: any) => c.id === Number(categoryId))

    if (category.value) {
      // 2. Fetch articles for this category
      const artsRes = await api.get(`/kb/articles?category_id=${categoryId}`)
      articles.value = artsRes.data
    }
  } catch (err: any) {
    toastError('Erro', 'Não foi possível carregar os dados desta categoria.')
  } finally {
    isLoading.value = false
  }
}

const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
</script>
