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
    const response = await api.get('/tickets/search', { params: { q: query } });
    return (response.data || []).map((t: any) => ({
      type: 'ticket',
      id: t.id,
      title: '#' + t.id + ' - ' + t.title,
      subtitle: [t.customer_name ? 'Cliente: ' + t.customer_name : '', t.group_name ? 'Grupo: ' + t.group_name : ''].filter(Boolean).join(' • '),
      route: '/tickets/' + t.id
    }));
  },
};
