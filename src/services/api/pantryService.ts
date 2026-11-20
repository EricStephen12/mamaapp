/**
 * Pantry Service — Local-First with Neon DB Cloud Sync
 * Persists pantry ingredients to device storage (SecureStore)
 * so they are instantly accessible offline and for guest users,
 * while syncing to Neon DB when authenticated.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from './client';
import { tokenStore } from './tokenStore';

const LEGACY_PANTRY_STORAGE_KEY = 'mama_pantry_items_v2';

function getStorageKey(): string {
  return `mama_pantry_v3_${tokenStore.getActiveScope()}`;
}

export interface ApiPantryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string | null;
  addedAt: string;
}

const DEFAULT_PANTRY: ApiPantryItem[] = [
  { id: 'p-1', name: 'Eggs', category: 'pantryStaples', addedAt: new Date().toISOString() },
  { id: 'p-2', name: 'Onions', category: 'pantryStaples', addedAt: new Date().toISOString() },
  { id: 'p-3', name: 'Tomatoes', category: 'pantryStaples', addedAt: new Date().toISOString() },
  { id: 'p-4', name: 'Cooking Oil', category: 'pantryStaples', addedAt: new Date().toISOString() },
];

let cachedPantry: ApiPantryItem[] = [...DEFAULT_PANTRY];
let hydratedScope: string | null = null;
let hasLocalMutationInSession = false;
const listeners = new Set<(items: ApiPantryItem[]) => void>();

function notify() {
  const snapshot = [...cachedPantry];
  listeners.forEach((fn) => fn(snapshot));
}

async function readFromStorage(): Promise<ApiPantryItem[]> {
  const key = getStorageKey();
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const item =
          localStorage.getItem(key) ||
          (tokenStore.getActiveScope() === 'guest' ? localStorage.getItem(LEGACY_PANTRY_STORAGE_KEY) : null);
        return item ? JSON.parse(item) : [...DEFAULT_PANTRY];
      }
      return [...DEFAULT_PANTRY];
    }
    const raw = await SecureStore.getItemAsync(key);
    if (raw) return JSON.parse(raw);
    if (tokenStore.getActiveScope() === 'guest') {
      const legacy = await SecureStore.getItemAsync(LEGACY_PANTRY_STORAGE_KEY);
      if (legacy) return JSON.parse(legacy);
    }
    return [...DEFAULT_PANTRY];
  } catch (err) {
    console.warn('[pantryService] Read storage error:', err);
    return [...DEFAULT_PANTRY];
  }
}

async function writeToStorage(items: ApiPantryItem[]): Promise<void> {
  const key = getStorageKey();
  try {
    const json = JSON.stringify(items);
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
    console.warn('[pantryService] Write storage error:', err);
  }
}

// Hydrate on module load
readFromStorage().then((stored) => {
  if (!hasLocalMutationInSession && Array.isArray(stored)) {
    cachedPantry = stored;
    hydratedScope = tokenStore.getActiveScope();
    notify();
  }
});

export const pantryService = {
  /**
   * Fetch all pantry items for the active user's data bank (instant local return + background cloud sync)
   */
  async fetchAll(): Promise<ApiPantryItem[]> {
    const activeScope = tokenStore.getActiveScope();
    if (hydratedScope !== activeScope) {
      const stored = await readFromStorage();
      cachedPantry = Array.isArray(stored) ? stored : [...DEFAULT_PANTRY];
      hydratedScope = activeScope;
      hasLocalMutationInSession = false;
      notify();
    }

    // Background cloud sync if authenticated
    if (tokenStore.isLoggedIn() && !hasLocalMutationInSession) {
      apiClient<ApiPantryItem[]>('/api/pantry')
        .then(async (remoteItems) => {
          if (Array.isArray(remoteItems) && !hasLocalMutationInSession) {
            cachedPantry = remoteItems;
            await writeToStorage(cachedPantry);
            notify();
          }
        })
        .catch(() => {});
    }

    return [...cachedPantry];
  },

  /**
   * Sync and persist pantry items locally and to cloud for the active user
   */
  async syncItems(
    items: { name: string; category?: string; quantity?: string }[]
  ): Promise<boolean> {
    const mapped: ApiPantryItem[] = items.map((i, idx) => ({
      id: `local-pantry-${idx}-${Date.now()}`,
      name: i.name,
      category: i.category || 'pantryStaples',
      quantity: i.quantity || null,
      addedAt: new Date().toISOString(),
    }));

    // 1. Immediately write to active user's local cache and storage
    hasLocalMutationInSession = true;
    cachedPantry = mapped;
    hydratedScope = tokenStore.getActiveScope();
    notify();
    await writeToStorage(cachedPantry);

    // 2. Cloud sync in background if authenticated
    if (tokenStore.isLoggedIn()) {
      apiClient('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }).catch((e) => {
        console.warn('[pantryService] syncItems error:', e);
      });
    }

    return true;
  },

  /**
   * Get synchronous snapshot of cached pantry items
   */
  getCachedPantry(): ApiPantryItem[] {
    return [...cachedPantry];
  },

  subscribe(listener: (items: ApiPantryItem[]) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Switch active pantry bank on sign-in / sign-out without deleting the user's saved bank
   */
  async clearLocalPantry(): Promise<void> {
    hydratedScope = null;
    await this.fetchAll();
  },
};
