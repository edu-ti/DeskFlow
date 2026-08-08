import api from './api';

export interface SearchResult {
  type: 'ticket' | 'article' | 'user';
  id: number;
  title: string;
  subtitle: string;
  route: string;
}

export const searchService = {
  async globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const response = await api.get('/search', { params: { q: query } });
    return response.data;
  },
};
