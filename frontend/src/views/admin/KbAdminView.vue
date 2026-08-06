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
    alert('Failed to load KB data');
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
    alert('Failed to save category');
  }
};

const deleteCategory = async (id: number) => {
  if (confirm('Are you sure? Articles in this category will lose their category.')) {
    try {
      await kbAdminService.deleteCategory(id);
      await loadData();
    } catch (error) {
      alert('Failed to delete category');
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
    alert('Failed to save article');
  }
};

const deleteArticle = async (id: number) => {
  if (confirm('Are you sure you want to delete this article?')) {
    try {
      await kbAdminService.deleteArticle(id);
      await loadData();
    } catch (error) {
      alert('Failed to delete article');
    }
  }
};

</script>

<template>
  <div class="max-w-6xl mx-auto py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-df-text mb-2">Knowledge Base Management</h1>
        <p class="text-df-text-muted">Manage articles and categories for your help center.</p>
      </div>
      
      <div class="flex gap-3">
        <button v-if="activeTab === 'categories'" @click="openCreateCategory" class="btn-primary flex items-center gap-2">
          <PlusIcon class="w-4 h-4" /> New Category
        </button>
        <button v-if="activeTab === 'articles'" @click="openCreateArticle" class="btn-primary flex items-center gap-2">
          <PlusIcon class="w-4 h-4" /> New Article
        </button>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex gap-4 mb-6 border-b border-white/10">
      <button 
        @click="activeTab = 'articles'" 
        class="pb-3 px-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2"
        :class="activeTab === 'articles' ? 'text-df-primary border-df-primary' : 'text-df-text-muted border-transparent hover:text-df-text'"
      >
        <BookOpenIcon class="w-4 h-4" /> Articles
      </button>
      <button 
        @click="activeTab = 'categories'" 
        class="pb-3 px-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2"
        :class="activeTab === 'categories' ? 'text-df-primary border-df-primary' : 'text-df-text-muted border-transparent hover:text-df-text'"
      >
        <FolderIcon class="w-4 h-4" /> Categories
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="isLoading" class="p-8 text-center text-df-text-muted glass-panel rounded-2xl">
      Loading Knowledge Base...
    </div>

    <!-- ARTICLES VIEW -->
    <div v-else-if="activeTab === 'articles'" class="glass-panel rounded-2xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-white/5 border-b border-white/10">
          <tr>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase">Title</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase">Category</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase">Status</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase">Visibility</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-df-text-muted uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/10">
          <tr v-for="article in articles" :key="article.id" class="hover:bg-white/5">
            <td class="px-6 py-4 font-medium text-df-text">{{ article.title }}</td>
            <td class="px-6 py-4 text-sm text-df-text-muted">{{ article.category?.name || 'Uncategorized' }}</td>
            <td class="px-6 py-4">
              <span v-if="article.is_published" class="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Published</span>
              <span v-else class="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Draft</span>
            </td>
            <td class="px-6 py-4">
              <span v-if="article.is_internal" class="px-2.5 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">Internal Only</span>
              <span v-else class="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Public</span>
            </td>
            <td class="px-6 py-4 text-right">
              <button @click="openEditArticle(article)" class="p-2 text-df-text-muted hover:text-df-text rounded-lg">
                <Edit2Icon class="w-4 h-4" />
              </button>
              <button @click="deleteArticle(article.id)" class="p-2 text-red-400 hover:text-red-300 rounded-lg">
                <Trash2Icon class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr v-if="articles.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-df-text-muted">No articles found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATEGORIES VIEW -->
    <div v-else-if="activeTab === 'categories'" class="glass-panel rounded-2xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-white/5 border-b border-white/10">
          <tr>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase">Name</th>
            <th class="px-6 py-4 text-xs font-medium text-df-text-muted uppercase">Description</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-df-text-muted uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/10">
          <tr v-for="cat in categories" :key="cat.id" class="hover:bg-white/5">
            <td class="px-6 py-4 font-medium text-df-text">{{ cat.name }}</td>
            <td class="px-6 py-4 text-sm text-df-text-muted">{{ cat.description }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="openEditCategory(cat)" class="p-2 text-df-text-muted hover:text-df-text rounded-lg">
                <Edit2Icon class="w-4 h-4" />
              </button>
              <button @click="deleteCategory(cat.id)" class="p-2 text-red-400 hover:text-red-300 rounded-lg">
                <Trash2Icon class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="3" class="px-6 py-8 text-center text-df-text-muted">No categories found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CATEGORY MODAL -->
    <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-df-bg border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div class="p-6 border-b border-white/10"><h2 class="text-xl font-bold">{{ editingCategory ? 'Edit Category' : 'New Category' }}</h2></div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm text-df-text-muted mb-1">Name</label>
            <input v-model="categoryForm.name" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary" />
          </div>
          <div>
            <label class="block text-sm text-df-text-muted mb-1">Description</label>
            <input v-model="categoryForm.description" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary" />
          </div>
        </div>
        <div class="p-6 border-t border-white/10 flex justify-end gap-3">
          <button @click="showCategoryModal = false" class="px-4 py-2 text-sm text-df-text-muted">Cancel</button>
          <button @click="saveCategory" class="btn-primary">Save</button>
        </div>
      </div>
    </div>

    <!-- ARTICLE MODAL -->
    <div v-if="showArticleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-df-bg border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-white/10"><h2 class="text-xl font-bold">{{ editingArticle ? 'Edit Article' : 'New Article' }}</h2></div>
        <div class="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label class="block text-sm text-df-text-muted mb-1">Title</label>
            <input v-model="articleForm.title" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary" />
          </div>
          <div>
            <label class="block text-sm text-df-text-muted mb-1">Category</label>
            <select v-model="articleForm.category_id" class="w-full bg-[#202020] border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary">
              <option :value="null">Uncategorized</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-df-text-muted mb-1">Content (Markdown)</label>
            <textarea v-model="articleForm.content" rows="10" class="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-df-primary font-mono text-sm resize-none"></textarea>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="articleForm.is_published" type="checkbox" class="rounded bg-white/5 text-df-primary" />
              <span class="text-sm">Published</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="articleForm.is_internal" type="checkbox" class="rounded bg-white/5 text-df-primary" />
              <span class="text-sm text-orange-400">Internal Only</span>
            </label>
          </div>
        </div>
        <div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5">
          <button @click="showArticleModal = false" class="px-4 py-2 text-sm text-df-text-muted">Cancel</button>
          <button @click="saveArticle" class="btn-primary">Save Article</button>
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
