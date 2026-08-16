<template>
  <div class="max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <router-link to="/portal" class="text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2 rounded-xl hover:bg-gray-100">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Novo Chamado</h1>
        <p class="text-sm text-gray-500 mt-0.5">Descreva sua solicitação para nossa equipe de atendimento.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Ticket Form -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
        <form @submit.prevent="submitTicket" class="space-y-6">
          
          <!-- Subject -->
          <div>
            <label for="title" class="block text-xs font-semibold text-gray-700 mb-1">
              Assunto do Chamado <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="title" 
              v-model="form.title" 
              @input="onTitleInput"
              required
              placeholder="Ex: Como redefinir minha senha de acesso"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm outline-none"
            >
          </div>

          <!-- Real-Time Deflection Suggestions Banner -->
          <div v-if="suggestedArticles.length > 0" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center gap-2 mb-3">
              <div class="p-1.5 bg-blue-600 text-white rounded-lg">
                <LightbulbIcon class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-blue-950 leading-tight">Artigos de Auto-Atendimento Sugeridos</h3>
                <p class="text-xs text-blue-700">Encontramos respostas na base de conhecimento que podem te ajudar imediatamente:</p>
              </div>
            </div>

            <div class="space-y-2">
              <div 
                v-for="article in suggestedArticles" 
                :key="article.id"
                class="flex items-center justify-between p-3 bg-white/90 hover:bg-white rounded-xl border border-blue-100 hover:border-blue-300 transition-all shadow-xs group"
              >
                <div class="flex items-center gap-3 min-w-0 pr-2">
                  <BookOpenIcon class="w-4 h-4 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <div class="truncate">
                    <h4 class="text-xs font-bold text-gray-900 truncate">{{ article.title }}</h4>
                    <span v-if="article.category" class="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {{ article.category.name }}
                    </span>
                  </div>
                </div>

                <button 
                  @click="openArticle(article)" 
                  type="button" 
                  class="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Ler Artigo</span>
                  <ExternalLinkIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Initial Message -->
          <div>
            <label for="message" class="block text-xs font-semibold text-gray-700 mb-1">
              Mensagem Detalhada <span class="text-red-500">*</span>
            </label>
            <p class="text-xs text-gray-400 mb-2">Descreva detalhadamente o que você precisa ou o problema que está enfrentando.</p>
            <textarea 
              id="message" 
              v-model="form.initial_article_body" 
              rows="6"
              required
              placeholder="Olá, gostaria de relatar que..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm outline-none resize-y"
            ></textarea>
          </div>

          <!-- Submit -->
          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="bg-df-primary hover:bg-df-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <SendIcon v-else class="w-4 h-4" />
              <span>Enviar Chamado</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Right Column: Helpful Tips -->
      <div class="space-y-4">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6">
          <div class="flex items-center gap-2 mb-3 text-emerald-700">
            <CheckCircleIcon class="w-5 h-5" />
            <h3 class="font-bold text-sm text-gray-900">Dicas para um suporte mais ágil</h3>
          </div>
          <ul class="text-xs text-gray-600 space-y-2.5 leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="text-blue-500 font-bold">•</span>
              <span>Forneça o máximo de detalhes possível sobre a situação.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500 font-bold">•</span>
              <span>Se houver mensagens de erro, inclua o texto exato na descrição.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500 font-bold">•</span>
              <span>Verifique os artigos sugeridos antes do envio para obter respostas imediatas.</span>
            </li>
          </ul>
        </div>

        <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 p-5 text-xs text-emerald-900">
          <p class="font-bold mb-1">Precisa de atendimento urgente?</p>
          <p class="text-emerald-700">Você também pode enviar mensagem para nosso WhatsApp oficial de suporte.</p>
        </div>
      </div>
    </div>

    <!-- Modal: Leitor do Artigo Sugerido (Deflexão) -->
    <div v-if="selectedArticle" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-xs p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <span v-if="selectedArticle.category" class="inline-block text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mb-1.5">
              {{ selectedArticle.category.name }}
            </span>
            <h3 class="text-lg font-bold text-gray-900 leading-snug">{{ selectedArticle.title }}</h3>
          </div>
          <button @click="selectedArticle = null" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 shrink-0">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Article Content -->
        <div class="p-6 max-h-[60vh] overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {{ selectedArticle.content }}
        </div>

        <!-- Footer / Deflection Action -->
        <div class="p-5 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span class="text-xs font-semibold text-gray-700 text-center sm:text-left">
            Este artigo resolveu sua dúvida?
          </span>
          <div class="flex items-center gap-2.5 w-full sm:w-auto">
            <button 
              @click="selectedArticle = null" 
              type="button" 
              class="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Ainda preciso abrir o chamado
            </button>
            <button 
              @click="confirmDeflection" 
              type="button" 
              class="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <CheckCircleIcon class="w-3.5 h-3.5" />
              <span>Sim, resolveu minha dúvida!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft as ArrowLeftIcon, 
  Send as SendIcon, 
  Loader2 as Loader2Icon, 
  Lightbulb as LightbulbIcon, 
  BookOpen as BookOpenIcon, 
  ExternalLink as ExternalLinkIcon, 
  CheckCircle as CheckCircleIcon, 
  X as XIcon 
} from 'lucide-vue-next';
import api from '@/services/api';
import { kbPublicService } from '@/services/kbPublicService';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { success, error: toastError } = useToast();

const isSubmitting = ref(false);
const suggestedArticles = ref<any[]>([]);
const selectedArticle = ref<any>(null);
let searchDebounceTimeout: any = null;

const form = ref({
  title: '',
  initial_article_body: '',
  group_id: 1,
  priority_id: 2,
});

const onTitleInput = () => {
  clearTimeout(searchDebounceTimeout);
  const query = form.value.title.trim();
  
  if (query.length < 3) {
    suggestedArticles.value = [];
    return;
  }

  searchDebounceTimeout = setTimeout(async () => {
    try {
      const results = await kbPublicService.searchArticles(query);
      suggestedArticles.value = results.slice(0, 3);
    } catch (err) {
      console.error('Erro na busca de deflexão de artigos', err);
    }
  }, 300);
};

const openArticle = (article: any) => {
  selectedArticle.value = article;
};

const confirmDeflection = () => {
  selectedArticle.value = null;
  success('Que ótimo!', 'Ficamos felizes em ajudar você a resolver sua dúvida instantaneamente!');
  router.push('/portal');
};

const submitTicket = async () => {
  isSubmitting.value = true;
  try {
    await api.post('/tickets', form.value);
    success('Sucesso', 'Seu chamado foi criado e em breve será respondido pela nossa equipe.');
    router.push('/portal');
  } catch (err: any) {
    toastError('Erro', 'Ocorreu um erro ao criar o chamado. Tente novamente.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
