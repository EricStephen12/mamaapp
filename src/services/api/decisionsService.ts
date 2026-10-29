/**
 * Decisions Service — logs cook/pass actions to Neon DB
 */
import { apiClient } from './client';

export const decisionsService = {
  async log(
    dishId: string,
    dishTitle: string,
    action: 'cooked' | 'passed',
    mealCostUsd: number,
    passReason?: string
  ): Promise<void> {
    try {
      await apiClient('/api/decisions', {
        method: 'POST',
        body: JSON.stringify({ dishId, dishTitle, action, mealCost: mealCostUsd, passReason }),
      });
    } catch (e) {
      // Best-effort: local state is already updated; don't block UX on failure
      console.warn('[decisionsService] log error:', e);
    }
  },
};
