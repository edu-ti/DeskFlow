<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search as SearchIcon, Book as BookIcon, Folder as FolderIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next';
import { kbPublicService } from '../../services/kbPublicService';
import type { Category, Article } from '../../services/kbAdminService';

const router = useRouter();

const categories = ref<Category[]>([]);
const articles = ref<Article[]>([]);
const isLoading = ref(true);

const searchQuery = ref('');
const selectedCategoryId = ref<number | null>(null);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  isLoading.value = true;
  try {
    categories.value = await kbPublicService.getCategories();
    await performSearch();
  } catch (error) {
    alert('Failed to load knowledge base');
  } finally {
    isLoading.value = false;
  }
};

const performSearch = async () => {
  try {
    articles.value = await kbPublicService.searchArticles(searchQuery.value, selectedCategoryId.value || undefined);
  } catch (error) {
    console.error(error);
  }
};

const selectCategory = async (id: number | null) => {
  selectedCategoryId.value = id;
  await performSearch();
};
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-df-text mb-4">How can we help you?</h1>
      <div class="max-w-2xl mx-auto relative">
        <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-df-text-muted w-5 h-5" />
        <input 
          v-model="searchQuery" 
          @keyup.enter="performSearch"
          type="text" 
          class="w-full bg-df-bg/50 border border-white/10 rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-df-primary focus:ring-2 focus:ring-df-primary/50 transition-all shadow-lg"
          placeholder="Search for articles, tutorials, FAQs..." 
        />
      </div>
    </div>

    <div class="flex gap-8">
      <!-- Categories Sidebar -->
      <div class="w-1/4">
        <h3 class="text-xs font-semibold text-df-text-muted uppercase tracking-wider mb-4">Categories</h3>
        <ul class="space-y-2">
          <li>
            <button 
              @click="selectCategory(null)"
              class="w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors"
              :class="selectedCategoryId === null ? 'bg-df-primary/20 text-df-primary' : 'text-df-text-muted hover:bg-white/5 hover:text-df-text'"
            >
              <FolderIcon class="w-4 h-4" /> All Categories
            </button>
          </li>
          <li v-for="cat in categories" :key="cat.id">
            <button 
              @click="selectCategory(cat.id)"
              class="w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors"
              :class="selectedCategoryId === cat.id ? 'bg-df-primary/20 text-df-primary' : 'text-df-text-muted hover:bg-white/5 hover:text-df-text'"
            >
              <FolderIcon class="w-4 h-4" /> {{ cat.name }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Articles List -->
      <div class="w-3/4">
        <div v-if="isLoading" class="p-8 text-center text-df-text-muted">Searching...</div>
        <div v-else-if="articles.length === 0" class="p-12 text-center glass-panel rounded-2xl">
          <BookIcon class="w-12 h-12 text-df-text-muted opacity-50 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-df-text">No articles found</h3>
          <p class="text-df-text-muted">Try adjusting your search or selecting a different category.</p>
        </div>
        <div v-else class="grid gap-4">
          <div 
            v-for="article in articles" 
            :key="article.id"
            @click="router.push(`/kb/${article.id}`)"
            class="glass-panel p-6 rounded-2xl hover:bg-white/[0.07] transition-all cursor-pointer group flex items-center justify-between"
          >
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-medium px-2 py-0.5 bg-white/10 rounded-full text-df-text-muted">
                  {{ article.category?.name || 'Uncategorized' }}
                </span>
                <span v-if="article.is_internal" class="text-xs font-bold px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                  Internal
                </span>
              </div>
              <h3 class="text-lg font-medium text-df-text group-hover:text-df-primary transition-colors">
                {{ article.title }}
              </h3>
            </div>
            <ChevronRightIcon class="w-5 h-5 text-df-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
