/**
 * Decisions Service — logs cook/pass actions to Neon DB
 */
import { apiClient } from './client';
import { tokenStore } from './tokenStore';

export interface MealDecisionItem {
  id: string;
  dishId: string;
  dishTitle: string;
  action: 'cooked' | 'passed';
  mealCost: number;
  passReason?: string | null;
  createdAt: string;
}

export const decisionsService = {
  async log(
    dishId: string,
    dishTitle: string,
    action: 'cooked' | 'passed',
    mealCostUsd: number,
    passReason?: string
  ): Promise<void> {
    if (!tokenStore.isLoggedIn()) return;
    try {
      await apiClient('/api/decisions', {
        method: 'POST',
        body: JSON.stringify({ dishId, dishTitle, action, mealCost: mealCostUsd, passReason }),
      });
    } catch {
      // Offline or unauthenticated — already saved locally
    }
  },

  async fetchRecent(limit = 20, timeoutMs?: number): Promise<MealDecisionItem[]> {
    if (!tokenStore.isLoggedIn()) return [];
    try {
      const result = await apiClient<MealDecisionItem[]>(`/api/decisions?limit=${limit}`, { timeoutMs });
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  },
};
