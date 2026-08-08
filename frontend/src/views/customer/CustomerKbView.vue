<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Search -->
    <div class="bg-[#0b1c3c] rounded-2xl p-8 sm:p-12 mb-8 text-center text-white shadow-lg relative overflow-hidden">
      <!-- Decorativos (opcional) -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div class="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-500 blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-blue-300 blur-3xl"></div>
      </div>
      
      <div class="relative z-10">
        <h1 class="text-3xl sm:text-4xl font-bold mb-4">Como podemos te ajudar?</h1>
        <p class="text-blue-200 mb-8 max-w-xl mx-auto text-lg">Busque por artigos, tutoriais e respostas para as perguntas mais frequentes.</p>
        
        <div class="max-w-2xl mx-auto relative">
          <form @submit.prevent="handleSearch">
            <div class="flex items-center bg-white rounded-xl shadow-inner p-2 focus-within:ring-4 focus-within:ring-blue-500/30 transition-shadow">
              <SearchIcon class="w-6 h-6 text-gray-400 ml-3 mr-2 flex-shrink-0" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Pesquisar..." 
                class="flex-1 py-3 px-2 text-gray-900 bg-transparent border-none outline-none text-lg focus:ring-0"
              >
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0">
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Search Results View -->
    <div v-if="hasSearched">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-900">Resultados da busca</h2>
        <button @click="clearSearch" class="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <ArrowLeftIcon class="w-4 h-4" /> Voltar para categorias
        </button>
      </div>
      
      <div v-if="isLoading" class="flex justify-center py-12">
        <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
      </div>
      <div v-else-if="searchResults.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-200">
        <InboxIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900">Nenhum artigo encontrado</h3>
        <p class="text-gray-500 mt-1">Não encontramos resultados para "{{ searchQuery }}". Tente outros termos.</p>
      </div>
      <div v-else class="space-y-4">
        <router-link 
          v-for="article in searchResults" 
          :key="article.id" 
          :to="'/portal/kb/articles/' + article.id"
          class="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <h3 class="text-lg font-medium text-gray-900 group-hover:text-blue-600 mb-2">{{ article.title }}</h3>
          <p class="text-gray-500 text-sm line-clamp-2" v-html="stripHtml(article.content)"></p>
        </router-link>
      </div>
    </div>

    <!-- Category Grid View -->
    <div v-else>
      <h2 class="text-xl font-bold text-gray-900 mb-6 px-1">Categorias em destaque</h2>
      
      <div v-if="isLoadingCategories" class="flex justify-center py-12">
        <Loader2Icon class="w-8 h-8 text-blue-500 animate-spin" />
      </div>
      <div v-else-if="categories.length === 0" class="text-center py-12 text-gray-500">
        Nenhuma categoria disponível no momento.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <router-link 
          v-for="category in categories" 
          :key="category.id" 
          :to="'/portal/kb/categories/' + category.id"
          class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
        >
          <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
            <FolderIcon class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-1 group-hover:text-blue-600">{{ category.name }}</h3>
          <p class="text-sm text-gray-500 line-clamp-2">{{ category.description || 'Nenhuma descrição' }}</p>
        </router-link>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search as SearchIcon, Loader2 as Loader2Icon, Folder as FolderIcon, Inbox as InboxIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { error: toastError } = useToast()

const searchQuery = ref('')
const hasSearched = ref(false)
const isLoading = ref(false)
const searchResults = ref<any[]>([])

const categories = ref<any[]>([])
const isLoadingCategories = ref(true)

onMounted(async () => {
  await fetchCategories()
})

const fetchCategories = async () => {
  isLoadingCategories.value = true
  try {
    const res = await api.get('/kb/categories')
    categories.value = res.data
  } catch (err: any) {
    toastError('Erro', 'Não foi possível carregar as categorias.')
  } finally {
    isLoadingCategories.value = false
  }
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  hasSearched.value = true
  isLoading.value = true
  try {
    const res = await api.get(`/kb/articles?q=${encodeURIComponent(searchQuery.value)}`)
    searchResults.value = res.data
  } catch (err: any) {
    toastError('Erro', 'Não foi possível realizar a busca.')
  } finally {
    isLoading.value = false
  }
}

const clearSearch = () => {
  hasSearched.value = false
  searchQuery.value = ''
  searchResults.value = []
}

const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
</script>
