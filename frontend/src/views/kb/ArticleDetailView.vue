<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronLeft as ChevronLeftIcon, Calendar as CalendarIcon, Folder as FolderIcon, Lock as LockIcon } from 'lucide-vue-next';
import { kbPublicService } from '../../services/kbPublicService';
import type { Article } from '../../services/kbAdminService';

const route = useRoute();
const router = useRouter();
const article = ref<Article | null>(null);
const isLoading = ref(true);
const error = ref('');

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  try {
    article.value = await kbPublicService.getArticleById(id);
  } catch (err) {
    error.value = 'Article not found or you do not have permission to view it.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <button @click="router.push('/kb')" class="flex items-center gap-2 text-sm text-df-text-muted hover:text-df-primary transition-colors mb-8">
      <ChevronLeftIcon class="w-4 h-4" /> Back to Knowledge Base
    </button>

    <div v-if="isLoading" class="p-12 text-center text-df-text-muted">
      Loading article...
    </div>

    <div v-else-if="error" class="glass-panel p-12 text-center rounded-2xl">
      <h2 class="text-xl font-bold text-red-400 mb-2">Oops!</h2>
      <p class="text-df-text-muted">{{ error }}</p>
      <button @click="router.push('/kb')" class="mt-6 btn-primary">Go to Home</button>
    </div>

    <div v-else-if="article" class="glass-panel rounded-3xl p-8 md:p-12">
      <!-- Article Header -->
      <div class="border-b border-white/10 pb-8 mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span class="flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-white/5 rounded-full text-df-text-muted">
            <FolderIcon class="w-3.5 h-3.5" /> {{ article.category?.name || 'Uncategorized' }}
          </span>
          <span v-if="article.is_internal" class="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full">
            <LockIcon class="w-3.5 h-3.5" /> Internal Document
          </span>
        </div>
        
        <h1 class="text-3xl md:text-4xl font-bold text-df-text mb-6">{{ article.title }}</h1>
        
        <div class="flex flex-wrap items-center gap-6 text-sm text-df-text-muted">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-df-primary/20 flex items-center justify-center text-df-primary font-bold text-[10px]">
              {{ article.author?.firstname?.[0] }}{{ article.author?.lastname?.[0] }}
            </div>
            <span>{{ article.author?.firstname }} {{ article.author?.lastname }}</span>
          </div>
          <div class="flex items-center gap-2">
            <CalendarIcon class="w-4 h-4" />
            <span>Updated on {{ new Date(article.updated_at).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>

      <!-- Article Content (Markdown rendered as simple whitespace for MVP) -->
      <div class="prose prose-invert max-w-none text-df-text-muted">
        <!-- Render simple markdown by keeping whitespace and linebreaks -->
        <p class="whitespace-pre-wrap leading-relaxed">{{ article.content }}</p>
      </div>
    </div>
  </div>
</template>
