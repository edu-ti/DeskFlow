import api from './api'

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  is_published: boolean;
  is_internal: boolean;
  category_id: number | null;
  category: Category | null;
  author_id: number;
  author: any;
  created_at: string;
  updated_at: string;
}

export const kbAdminService = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await api.get('/kb-admin/categories')
    return res.data
  },

  async createCategory(data: Partial<Category>) {
    const res = await api.post('/kb-admin/categories', data)
    return res.data
  },

  async updateCategory(id: number, data: Partial<Category>) {
    const res = await api.put(`/kb-admin/categories/${id}`, data)
    return res.data
  },

  async deleteCategory(id: number) {
    const res = await api.delete(`/kb-admin/categories/${id}`)
    return res.data
  },

  // Articles
  async getArticles(): Promise<Article[]> {
    const res = await api.get('/kb-admin/articles')
    return res.data
  },

  async getArticleById(id: number): Promise<Article> {
    const res = await api.get(`/kb-admin/articles/${id}`)
    return res.data
  },

  async createArticle(data: Partial<Article>) {
    const res = await api.post('/kb-admin/articles', data)
    return res.data
  },

  async updateArticle(id: number, data: Partial<Article>) {
    const res = await api.put(`/kb-admin/articles/${id}`, data)
    return res.data
  },

  async deleteArticle(id: number) {
    const res = await api.delete(`/kb-admin/articles/${id}`)
    return res.data
  }
}
