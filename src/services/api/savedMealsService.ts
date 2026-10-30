/**
 * Saved Meals Service — real Neon DB operations
 * Handles saving, removing, and fetching meals from the backend.
 */
import { apiClient } from './client';

export interface ApiSavedMeal {
  id: string;
  userId: string;
  mealId: string;
  title: string;
  type: 'home' | 'eating_out';
  cookTime: string;
  cost: string;
  costNumeric: number;
  imageUrl?: string | null;
  recipeSteps: string[];
  ingredients?: { name: string; amount: string }[] | null;
  spotName?: string | null;
  vibe?: string | null;
  savedAt: string;
}

export interface SaveMealPayload {
  mealId: string;
  title: string;
  type: 'home' | 'eating_out';
  cookTime: string;
  cost: string;
  costNumeric: number;
  imageUrl?: string | null;
  recipeSteps?: string[];
  ingredients?: { name: string; amount: string }[];
  spotName?: string;
  vibe?: string;
}

export const savedMealsService = {
  async fetchAll(): Promise<ApiSavedMeal[]> {
    try {
      return await apiClient<ApiSavedMeal[]>('/api/saved-meals');
    } catch {
      return [];
    }
  },

  async saveMeal(payload: SaveMealPayload): Promise<boolean> {
    try {
      await apiClient('/api/saved-meals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (e) {
      console.warn('[savedMealsService] saveMeal error:', e);
      return false;
    }
  },

  async removeMeal(id: string): Promise<boolean> {
    try {
      await apiClient(`/api/saved-meals/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      console.warn('[savedMealsService] removeMeal error:', e);
      return false;
    }
  },
};
