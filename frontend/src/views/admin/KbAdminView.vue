<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus as PlusIcon, Edit2 as Edit2Icon, Trash2 as Trash2Icon, BookOpen as BookOpenIcon, Folder as FolderIcon } from 'lucide-vue-next';
import { kbAdminService, type Category, type Article } from '../../services/kbAdminService';

const activeTab = ref('articles'); // 'articles' or 'categories'

// Data
const categories = ref<Category[]>([]);
const articles = ref<Article[]>([]);
const isLoading = ref(true);

// Modals state
const showCategoryModal = ref(false);
const showArticleModal = ref(false);

const editingCategory = ref<Category | null>(null);
const editingArticle = ref<Article | null>(null);

// Forms
const categoryForm = ref({ name: '', description: '' });
const articleForm = ref({ title: '', content: '', category_id: null as number | null, is_published: false, is_internal: false });

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  isLoading.value = true;
  try {
    categories.value = await kbAdminService.getCategories();
    articles.value = await kbAdminService.getArticles();
  } catch (error) {
    alert('Falha ao carregar os dados da Base de Conhecimento');
  } finally {
    isLoading.value = false;
  }
};

// CATEGORY ACTIONS
const openCreateCategory = () => {
  editingCategory.value = null;
  categoryForm.value = { name: '', description: '' };
  showCategoryModal.value = true;
};

const openEditCategory = (cat: Category) => {
  editingCategory.value = cat;
  categoryForm.value = { name: cat.name, description: cat.description };
  showCategoryModal.value = true;
};

const saveCategory = async () => {
  try {
    if (editingCategory.value) {
      await kbAdminService.updateCategory(editingCategory.value.id, categoryForm.value);
    } else {
      await kbAdminService.createCategory(categoryForm.value);
    }
    showCategoryModal.value = false;
    await loadData();
  } catch (error) {
    alert('Falha ao salvar categoria');
  }
};

const deleteCategory = async (id: number) => {
  if (confirm('Tem certeza? Os artigos desta categoria perderão a categoria.')) {
    try {
      await kbAdminService.deleteCategory(id);
      await loadData();
    } catch (error) {
      alert('Falha ao excluir categoria');
    }
  }
};

// ARTICLE ACTIONS
const openCreateArticle = () => {
  editingArticle.value = null;
  articleForm.value = { title: '', content: '', category_id: null, is_published: false, is_internal: false };
  showArticleModal.value = true;
};

const openEditArticle = (art: Article) => {
  editingArticle.value = art;
  articleForm.value = { 
    title: art.title, 
    content: art.content, 
    category_id: art.category_id,
    is_published: art.is_published,
    is_internal: art.is_internal
  };
  showArticleModal.value = true;
};

const saveArticle = async () => {
  try {
    if (editingArticle.value) {
      await kbAdminService.updateArticle(editingArticle.value.id, articleForm.value);
    } else {
      await kbAdminService.createArticle(articleForm.value);
    }
    showArticleModal.value = false;
    await loadData();
  } catch (error) {
    alert('Falha ao salvar artigo');
  }
};

const deleteArticle = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir este artigo?')) {
    try {
      await kbAdminService.deleteArticle(id);
      await loadData();
    } catch (error) {
      alert('Falha ao excluir artigo');
    }
  }
};

</script>

<template>
  <div class="max-w-6xl mx-auto py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Gerenciamento da Base de Conhecimento</h1>
        <p class="text-gray-500">Gerencie artigos e categorias para sua central de ajuda.</p>
      </div>
      
      <div class="flex gap-3">
        <button v-if="activeTab === 'categories'" @click="openCreateCategory" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md">
          <PlusIcon class="w-4 h-4" /> Nova Categoria
        </button>
        <button v-if="activeTab === 'articles'" @click="openCreateArticle" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md">
          <PlusIcon class="w-4 h-4" /> Novo Artigo
        </button>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex gap-4 mb-6 border-b border-gray-200">
      <button 
        @click="activeTab = 'articles'" 
        class="pb-3 px-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2"
        :class="activeTab === 'articles' ? 'text-df-primary border-df-primary' : 'text-gray-500 border-transparent hover:text-gray-800'"
      >
        <BookOpenIcon class="w-4 h-4" /> Artigos
      </button>
      <button 
        @click="activeTab = 'categories'" 
        class="pb-3 px-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2"
        :class="activeTab === 'categories' ? 'text-df-primary border-df-primary' : 'text-gray-500 border-transparent hover:text-gray-800'"
      >
        <FolderIcon class="w-4 h-4" /> Categorias
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="isLoading" class="p-8 text-center text-gray-500 bg-white border border-gray-200 shadow-sm rounded-xl">
      Carregando Base de Conhecimento...
    </div>

    <!-- ARTICLES VIEW -->
    <div v-else-if="activeTab === 'articles'" class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Título</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Categoria</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Visibilidade</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="article in articles" :key="article.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-800">{{ article.title }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ article.category?.name || 'Sem Categoria' }}</td>
            <td class="px-6 py-4">
              <span v-if="article.is_published" class="px-2.5 py-1 bg-green-100 text-green-700 font-medium text-xs rounded-full">Publicado</span>
              <span v-else class="px-2.5 py-1 bg-yellow-100 text-yellow-700 font-medium text-xs rounded-full">Rascunho</span>
            </td>
            <td class="px-6 py-4">
              <span v-if="article.is_internal" class="px-2.5 py-1 bg-orange-100 text-orange-700 font-medium text-xs rounded-full">Apenas Interno</span>
              <span v-else class="px-2.5 py-1 bg-blue-100 text-blue-700 font-medium text-xs rounded-full">Público</span>
            </td>
            <td class="px-6 py-4 text-right">
              <button @click="openEditArticle(article)" class="p-2 text-df-primary hover:text-df-primary-hover hover:bg-gray-100 rounded-lg">
                <Edit2Icon class="w-4 h-4" />
              </button>
              <button @click="deleteArticle(article.id)" class="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2Icon class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr v-if="articles.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhum artigo encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATEGORIES VIEW -->
    <div v-else-if="activeTab === 'categories'" class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th class="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Descrição</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-800">{{ cat.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ cat.description }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="openEditCategory(cat)" class="p-2 text-df-primary hover:text-df-primary-hover hover:bg-gray-100 rounded-lg">
                <Edit2Icon class="w-4 h-4" />
              </button>
              <button @click="deleteCategory(cat.id)" class="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2Icon class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="3" class="px-6 py-8 text-center text-gray-500">Nenhuma categoria encontrada.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATEGORY MODAL -->
    <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl">
        <div class="p-6 border-b border-gray-200"><h2 class="text-xl font-bold text-gray-800">{{ editingCategory ? 'Editar Categoria' : 'Nova Categoria' }}</h2></div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Nome</label>
            <input v-model="categoryForm.name" class="w-full bg-white border border-gray-300 text-gray-800 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" />
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Descrição</label>
            <input v-model="categoryForm.description" class="w-full bg-white border border-gray-300 text-gray-800 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" />
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button @click="showCategoryModal = false" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">Cancelar</button>
          <button @click="saveCategory" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md">Salvar</button>
        </div>
      </div>
    </div>

    <!-- ARTICLE MODAL -->
    <div v-if="showArticleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-gray-200"><h2 class="text-xl font-bold text-gray-800">{{ editingArticle ? 'Editar Artigo' : 'Novo Artigo' }}</h2></div>
        <div class="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Título</label>
            <input v-model="articleForm.title" class="w-full bg-white border border-gray-300 text-gray-800 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary" />
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Categoria</label>
            <select v-model="articleForm.category_id" class="w-full bg-white border border-gray-300 text-gray-800 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary">
              <option :value="null">Sem Categoria</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Conteúdo (Markdown)</label>
            <textarea v-model="articleForm.content" rows="10" class="w-full bg-white border border-gray-300 text-gray-800 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary focus:ring-1 focus:ring-df-primary font-mono text-sm resize-none"></textarea>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="articleForm.is_published" type="checkbox" class="rounded border-gray-300 text-df-primary focus:ring-df-primary" />
              <span class="text-sm text-gray-800">Publicado</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="articleForm.is_internal" type="checkbox" class="rounded border-gray-300 text-df-primary focus:ring-df-primary" />
              <span class="text-sm text-orange-600 font-medium">Apenas Interno</span>
            </label>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button @click="showArticleModal = false" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">Cancelar</button>
          <button @click="saveArticle" class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md">Salvar Artigo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>
