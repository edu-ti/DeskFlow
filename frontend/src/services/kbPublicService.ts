import api from './api'
import type { Category, Article } from './kbAdminService'

export const kbPublicService = {
  async getCategories(): Promise<Category[]> {
    const res = await api.get('/kb/categories')
    return res.data
  },

  async searchArticles(query: string = '', categoryId?: number): Promise<Article[]> {
    let url = `/kb/articles?q=${encodeURIComponent(query)}`
    if (categoryId) url += `&category_id=${categoryId}`
    const res = await api.get(url)
    return res.data
  },

  async getArticleById(id: number): Promise<Article> {
    const res = await api.get(`/kb/articles/${id}`)
    return res.data
  }
}
