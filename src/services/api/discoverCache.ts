/**
 * Lightweight on-device cache for Discover feed decks.
 * Stores up to 3 compact real AI meals per category filter scoped by country/cuisine/diet
 * so Discover paints immediately on repeat visits (staying comfortably under SecureStore's 2KB limit).
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type CachedDiscoverFilter = 'all' | 'clean_healthy' | 'high_protein' | 'light_night';

export interface CachedDiscoverItem {
  id: string;
  categoryType: 'home';
  cookTimeOrDistance: string;
  title: string;
  nutrition: string;
  reason: string;
  imageUrl: string;
  baseCostUsd: number;
  cuisineTags: string[];
  healthCategory?: CachedDiscoverFilter;
  steps?: string[];
  ingredients?: { name: string; amount: string }[];
}

interface StoredSlot {
  contextKey: string;
  meals: CachedDiscoverItem[];
}

const KEY_PREFIX = 'mama_disc_v1_';
const clip = (val: string, max: number) =>
  val.length > max ? `${val.slice(0, max - 1).trimEnd()}.` : val;

function compactMeals(meals: CachedDiscoverItem[]): CachedDiscoverItem[] {
  return meals.slice(0, 3).map((m) => ({
    id: m.id,
    categoryType: 'home',
    cookTimeOrDistance: clip(m.cookTimeOrDistance || '15 MIN', 14),
    title: clip(m.title, 44),
    nutrition: clip(m.nutrition || 'Balanced Home Meal', 44),
    reason: clip(m.reason || '', 72),
    imageUrl: '',
    baseCostUsd: m.baseCostUsd,
    cuisineTags: (m.cuisineTags || []).slice(0, 2),
    healthCategory: m.healthCategory,
    ingredients: (m.ingredients || []).slice(0, 4).map((i) => ({
      name: clip(i.name, 26),
      amount: clip(i.amount, 18),
    })),
    steps: (m.steps || []).slice(0, 3).map((s) => clip(s, 85)),
  }));
}

export const discoverCache = {
  async get(filter: CachedDiscoverFilter, contextKey: string): Promise<CachedDiscoverItem[]> {
    const storageKey = `${KEY_PREFIX}${filter}`;
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
      } else {
        raw = await SecureStore.getItemAsync(storageKey);
      }
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredSlot;
      if (parsed?.contextKey === contextKey && Array.isArray(parsed.meals)) {
        return parsed.meals;
      }
    } catch {
      // Ignore corrupt cache
    }
    return [];
  },

  async set(
    filter: CachedDiscoverFilter,
    contextKey: string,
    meals: CachedDiscoverItem[]
  ): Promise<void> {
    if (!meals || meals.length === 0) return;
    const storageKey = `${KEY_PREFIX}${filter}`;
    const payload: StoredSlot = { contextKey, meals: compactMeals(meals) };
    const serialized = JSON.stringify(payload);
    if (serialized.length > 1950) {
      payload.meals = payload.meals.slice(0, 2);
    }
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        }
        return;
      }
      await SecureStore.setItemAsync(storageKey, JSON.stringify(payload));
    } catch {
      // Non-fatal cache write error
    }
  },
};
