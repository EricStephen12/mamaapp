/**
 * Saved Meals Service — Local-First with Neon DB Cloud Sync
 * Persists bookmarked and saved meals to hardware-backed storage (SecureStore)
 * so meals are instantly available offline and in guest mode, while syncing to
 * Neon DB when authenticated.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from './client';
import { tokenStore } from './tokenStore';

const LEGACY_STORAGE_KEY = 'mama_saved_meals_v2';

function getStorageKey(): string {
  return `mama_saved_meals_v3_${tokenStore.getActiveScope()}`;
}

export interface ApiSavedMeal {
  id: string;
  userId?: string;
  mealId: string;
  title: string;
  type: 'home' | 'eating_out';
  cookTime: string;
  cost: string;
  costNumeric: number;
  imageUrl?: string | null;
  recipeSteps?: string[];
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

// In-memory cache & listeners
let cachedMeals: ApiSavedMeal[] = [];
let hydratedScope: string | null = null;
let hasLocalMutationInSession = false;
const listeners = new Set<(meals: ApiSavedMeal[]) => void>();

async function readFromStorage(): Promise<ApiSavedMeal[]> {
  const key = getStorageKey();
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const item =
          localStorage.getItem(key) ||
          (tokenStore.getActiveScope() === 'guest' ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
        return item ? JSON.parse(item) : [];
      }
      return [];
    }
    const raw = await SecureStore.getItemAsync(key);
    if (raw) return JSON.parse(raw);
    if (tokenStore.getActiveScope() === 'guest') {
      const legacy = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
      if (legacy) return JSON.parse(legacy);
    }
    return [];
  } catch (err) {
    console.warn('[savedMealsService] Read storage error:', err);
    return [];
  }
}

async function writeToStorage(meals: ApiSavedMeal[]): Promise<void> {
  const key = getStorageKey();
  try {
    const json = JSON.stringify(meals);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, json);
      }
      return;
    }
    await SecureStore.setItemAsync(key, json, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    console.warn('[savedMealsService] Write storage error:', err);
  }
}

function notify() {
  const clone = [...cachedMeals];
  listeners.forEach((fn) => fn(clone));
}

// Initialize cache from local storage on module import
readFromStorage().then((stored) => {
  if (!hasLocalMutationInSession && Array.isArray(stored)) {
    cachedMeals = stored;
    hydratedScope = tokenStore.getActiveScope();
    notify();
  }
});

export const savedMealsService = {
  /**
   * Get all currently saved meals for the active user's bank (instant local return + background cloud sync)
   */
  async fetchAll(): Promise<ApiSavedMeal[]> {
    const activeScope = tokenStore.getActiveScope();
    if (hydratedScope !== activeScope) {
      const stored = await readFromStorage();
      cachedMeals = Array.isArray(stored) ? stored : [];
      hydratedScope = activeScope;
      hasLocalMutationInSession = false;
      notify();
    }

    // Try cloud sync in background if user is authenticated
    if (tokenStore.isLoggedIn() && !hasLocalMutationInSession) {
      apiClient<ApiSavedMeal[]>('/api/saved-meals')
        .then(async (remoteMeals) => {
          if (Array.isArray(remoteMeals) && !hasLocalMutationInSession) {
            // Merge remote meals with local meals by mealId
            const map = new Map<string, ApiSavedMeal>();
            cachedMeals.forEach((m) => map.set(m.mealId || m.id, m));
            remoteMeals.forEach((m) => map.set(m.mealId || m.id, m));
            cachedMeals = Array.from(map.values());
            await writeToStorage(cachedMeals);
            notify();
          }
        })
        .catch(() => {});
    }

    return [...cachedMeals];
  },

  /**
   * Save a meal locally immediately and sync to cloud in background
   */
  async saveMeal(payload: SaveMealPayload): Promise<boolean> {
    hasLocalMutationInSession = true;
    const newEntry: ApiSavedMeal = {
      id: payload.mealId,
      mealId: payload.mealId,
      title: payload.title,
      type: payload.type,
      cookTime: payload.cookTime,
      cost: payload.cost,
      costNumeric: payload.costNumeric,
      imageUrl: payload.imageUrl || null,
      recipeSteps: payload.recipeSteps || [],
      ingredients: payload.ingredients || null,
      spotName: payload.spotName || null,
      vibe: payload.vibe || null,
      savedAt: new Date().toISOString(),
    };

    // 1. Immediately update in-memory cache and local storage
    const existingIndex = cachedMeals.findIndex((m) => (m.mealId || m.id) === payload.mealId);
    if (existingIndex >= 0) {
      cachedMeals[existingIndex] = newEntry;
    } else {
      cachedMeals.unshift(newEntry);
    }
    await writeToStorage(cachedMeals);
    notify();

    // 2. Cloud sync in background if authenticated
    const token = tokenStore.getToken();
    if (token) {
      apiClient('/api/saved-meals', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).catch((e) => {
        console.warn('[savedMealsService] Cloud sync error:', e);
      });
    }

    return true;
  },

  /**
   * Remove a meal locally immediately and sync to cloud in background
   */
  async removeMeal(id: string): Promise<boolean> {
    // 1. Remove from local cache and storage
    hasLocalMutationInSession = true;
    cachedMeals = cachedMeals.filter((m) => m.id !== id && m.mealId !== id);
    await writeToStorage(cachedMeals);
    notify();

    // 2. Cloud sync in background if authenticated
    const token = tokenStore.getToken();
    if (token) {
      apiClient(`/api/saved-meals/${id}`, { method: 'DELETE' }).catch((e) => {
        console.warn('[savedMealsService] Cloud delete error:', e);
      });
    }

    return true;
  },

  /**
   * Subscribe to live updates of saved meals
   */
  subscribe(listener: (meals: ApiSavedMeal[]) => void): () => void {
    listeners.add(listener);
    // Emit current cached meals immediately
    listener([...cachedMeals]);
    return () => listeners.delete(listener);
  },

  /**
   * Get synchronous snapshot of cached meals
   */
  getCachedMeals(): ApiSavedMeal[] {
    return [...cachedMeals];
  },

  /**
   * Switch active saved meals bank on sign-in / sign-out without deleting the user's saved bank
   */
  async clearLocalSavedMeals(): Promise<void> {
    hydratedScope = null;
    await this.fetchAll();
  },
};
