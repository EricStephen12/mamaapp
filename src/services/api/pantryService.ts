/**
 * Pantry Service — syncs pantry items to Neon DB
 */
import { apiClient } from './client';

export interface ApiPantryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string | null;
  addedAt: string;
}

export const pantryService = {
  async fetchAll(): Promise<ApiPantryItem[]> {
    try {
      return await apiClient<ApiPantryItem[]>('/api/pantry');
    } catch {
      return [];
    }
  },

  async syncItems(
    items: { name: string; category?: string; quantity?: string }[]
  ): Promise<boolean> {
    try {
      await apiClient('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      return true;
    } catch (e) {
      console.warn('[pantryService] syncItems error:', e);
      return false;
    }
  },
};
