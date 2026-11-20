/**
 * AI Meal Cache
 * Keeps the most recent AI-generated meals on the device so dice rolls still
 * return fresh AI dishes when the network is slow or offline.
 *
 * SecureStore is not designed for values over ~2KB, so each meal is stored
 * under its own key (mama_ai_meal_0 ... mama_ai_meal_N) and trimmed before saving.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { RolledMeal } from './rollService';

const MAX_CACHED_MEALS = 8;
const SLOT_KEY_PREFIX = 'mama_ai_meal_';
const WEB_STORAGE_KEY = 'mama_ai_meal_cache_v1';

let cachedMeals: RolledMeal[] = [];
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

const clip = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}.` : value;

/** Trim a meal so a single serialized slot stays comfortably under 2KB */
function compactMeal(meal: RolledMeal): RolledMeal {
  return {
    id: meal.id,
    title: clip(meal.title, 48),
    subtitle: clip(meal.subtitle || '', 90),
    timeOfDay: meal.timeOfDay,
    cookTimeMinutes: meal.cookTimeMinutes,
    estCost: meal.estCost,
    imageUrl: meal.imageUrl,
    pantryNote: meal.pantryNote ? clip(meal.pantryNote, 70) : undefined,
    mamaTip: meal.mamaTip ? clip(meal.mamaTip, 110) : undefined,
    ingredients: meal.ingredients.slice(0, 7).map((i) => ({
      name: clip(i.name, 32),
      amount: clip(i.amount, 24),
    })),
    steps: meal.steps.slice(0, 5).map((s) => clip(s, 150)),
  };
}

function isValidMeal(value: unknown): value is RolledMeal {
  const m = value as RolledMeal;
  return (
    !!m &&
    typeof m.title === 'string' &&
    Array.isArray(m.steps) &&
    Array.isArray(m.ingredients) &&
    typeof m.timeOfDay === 'string'
  );
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(WEB_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          cachedMeals = Array.isArray(parsed) ? parsed.filter(isValidMeal) : [];
        }
      } else {
        const slots = await Promise.all(
          Array.from({ length: MAX_CACHED_MEALS }, (_, i) =>
            SecureStore.getItemAsync(`${SLOT_KEY_PREFIX}${i}`).catch(() => null)
          )
        );
        cachedMeals = slots
          .map((raw) => {
            try {
              return raw ? JSON.parse(raw) : null;
            } catch {
              return null;
            }
          })
          .filter(isValidMeal);
      }
    } catch {
      cachedMeals = [];
    }
    hydrated = true;
  })();

  return hydratePromise;
}

async function persist(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(cachedMeals));
      }
      return;
    }
    await Promise.all(
      Array.from({ length: MAX_CACHED_MEALS }, (_, i) => {
        const key = `${SLOT_KEY_PREFIX}${i}`;
        const meal = cachedMeals[i];
        return meal
          ? SecureStore.setItemAsync(key, JSON.stringify(meal))
          : SecureStore.deleteItemAsync(key);
      })
    );
  } catch (err) {
    console.warn('[aiMealCache] persist error:', err);
  }
}

// Start loading as soon as the module is imported
hydrate();

export const aiMealCache = {
  /** Save a freshly generated AI meal (newest first, de-duplicated by title) */
  async add(meal: RolledMeal): Promise<void> {
    await hydrate();
    const compact = compactMeal(meal);
    const titleKey = compact.title.toLowerCase();
    cachedMeals = [compact, ...cachedMeals.filter((m) => m.title.toLowerCase() !== titleKey)].slice(
      0,
      MAX_CACHED_MEALS
    );
    await persist();
  },

  /**
   * Pick a cached AI meal that passes the given filter.
   * Prefers meals for the same time of day.
   */
  async pick(
    timeOfDay: RolledMeal['timeOfDay'],
    isUsable: (meal: RolledMeal) => boolean
  ): Promise<RolledMeal | null> {
    await hydrate();
    const usable = cachedMeals.filter(isUsable);
    if (usable.length === 0) return null;
    const samePeriod = usable.filter((m) => m.timeOfDay === timeOfDay);
    const pool = samePeriod.length > 0 ? samePeriod : usable;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  /** Wipe cache (used on sign out / account deletion) */
  async clear(): Promise<void> {
    cachedMeals = [];
    hydrated = true;
    await persist();
  },
};

