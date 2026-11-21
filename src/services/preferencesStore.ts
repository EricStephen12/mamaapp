/**
 * User Kitchen Pass Store
 * Persists the user's culinary DNA, kitchen equipment, country, currency, and weekly budget.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { tokenStore } from './api/tokenStore';
import { userPreferencesService } from './api/userPreferencesService';

const LEGACY_KITCHEN_PASS_KEY = 'mama_kitchen_pass_v1';

function getStorageKey(): string {
  return `mama_kitchen_pass_v2_${tokenStore.getActiveScope()}`;
}

async function loadPassFromStorage(): Promise<Partial<UserKitchenPass> | null> {
  const key = getStorageKey();
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key) || (tokenStore.getActiveScope() === 'guest' ? localStorage.getItem(LEGACY_KITCHEN_PASS_KEY) : null);
        return item ? JSON.parse(item) : null;
      }
      return null;
    }
    const raw = await SecureStore.getItemAsync(key);
    if (raw) return JSON.parse(raw);
    if (tokenStore.getActiveScope() === 'guest') {
      const legacy = await SecureStore.getItemAsync(LEGACY_KITCHEN_PASS_KEY);
      return legacy ? JSON.parse(legacy) : null;
    }
    return null;
  } catch (err) {
    console.warn('[preferencesStore] Read storage error:', err);
    return null;
  }
}

async function savePassToStorage(pass: UserKitchenPass): Promise<void> {
  const key = getStorageKey();
  try {
    const json = JSON.stringify(pass);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, json);
      }
      return;
    }
    const options = Platform.OS === 'ios'
      ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
      : undefined;
    await SecureStore.setItemAsync(key, json, options);
  } catch (err) {
    console.warn('[preferencesStore] Write storage error:', err);
  }
}

export interface SupportedCountry {
  id: string; // 'NG', 'GB', 'US', 'GH', 'KE', 'CA', 'EU', 'ZA', 'AU', 'custom'
  name: string;
  regionCode: string;
  currencyCode: string;
  currencySymbol: string;
  defaultWeeklyBudget: number;
  mamaGreeting: string;
  popularStaples: string[];
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    id: 'NG',
    name: 'Nigeria',
    regionCode: 'NG',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    defaultWeeklyBudget: 35000,
    mamaGreeting: "Ah, my Nigerian child! Jollof, plantains, and proper pepper seasoning.",
    popularStaples: ['Plantains', 'Eggs', 'Scotch Bonnet (Ata Rodo)', 'Rice', 'Indomie', 'Yam'],
  },
  {
    id: 'GB',
    name: 'United Kingdom',
    regionCode: 'GB',
    currencyCode: 'GBP',
    currencySymbol: '£',
    defaultWeeklyBudget: 65,
    mamaGreeting: "London & UK! Hearty comfort without Tesco meal-deal boredom.",
    popularStaples: ['Cheddar', 'Eggs', 'Sourdough', 'Baked Beans', 'Curry Paste', 'Potatoes'],
  },
  {
    id: 'US',
    name: 'United States',
    regionCode: 'US',
    currencyCode: 'USD',
    currencySymbol: '$',
    defaultWeeklyBudget: 85,
    mamaGreeting: "State-side! We'll beat the $30 DoorDash trap together.",
    popularStaples: ['Tortillas', 'Eggs', 'Black Beans', 'Salsa', 'Hot Sauce', 'Pasta'],
  },
  {
    id: 'GH',
    name: 'Ghana',
    regionCode: 'GH',
    currencyCode: 'GHS',
    currencySymbol: 'GH₵',
    defaultWeeklyBudget: 450,
    mamaGreeting: "Akwaaba! Delicious waakye, rich shito, and golden fried plantains.",
    popularStaples: ['Plantains', 'Shito', 'Eggs', 'Gari', 'Tomato Paste', 'Rice'],
  },
  {
    id: 'KE',
    name: 'Kenya',
    regionCode: 'KE',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    defaultWeeklyBudget: 6500,
    mamaGreeting: "Karibu! Soft chapati, savory sukuma wiki, and warm home comfort.",
    popularStaples: ['Chapati flour', 'Sukuma Wiki', 'Eggs', 'Tomatoes', 'Onions', 'Royco'],
  },
  {
    id: 'CA',
    name: 'Canada',
    regionCode: 'CA',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    defaultWeeklyBudget: 110,
    mamaGreeting: "Warm comfort for cold days. Easy, fast, and cozy.",
    popularStaples: ['Cheddar', 'Eggs', 'Bread', 'Maple Syrup', 'Ground Beef', 'Pasta'],
  },
  {
    id: 'EU',
    name: 'Europe (Eurozone)',
    regionCode: 'EU',
    currencyCode: 'EUR',
    currencySymbol: '€',
    defaultWeeklyBudget: 75,
    mamaGreeting: "Magnificent olive oil, crusty bread, and effortless European flavors.",
    popularStaples: ['Olive Oil', 'Parmigiano / Gouda', 'Baguette', 'Tomatoes', 'Eggs', 'Pasta'],
  },
  {
    id: 'ZA',
    name: 'South Africa',
    regionCode: 'ZA',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    defaultWeeklyBudget: 950,
    mamaGreeting: "Lekker comfort! Warm savory meals with zero waste.",
    popularStaples: ['Boerewors', 'Chakalaka', 'Eggs', 'Pap', 'Onions', 'Bread'],
  },
  {
    id: 'AU',
    name: 'Australia',
    regionCode: 'AU',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    defaultWeeklyBudget: 120,
    mamaGreeting: "G'day! Fresh, vibrant, and quick meals that hit the spot.",
    popularStaples: ['Avocado', 'Sourdough', 'Eggs', 'Cheddar', 'Pasta', 'Minced Meat'],
  },
];

export interface SupportedCurrency {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export function getMamaProfileForCountry(countryCode: string): {
  cuisineAnchor: string;
  cuisineLabel: string;
  cookingGear: string;
  cookingGearLabel: string;
} {
  const code = (countryCode || '').trim().toUpperCase();
  // Europe & UK
  if (['GB', 'UK', 'EU', 'FR', 'IT', 'DE', 'ES', 'NL', 'IE', 'PT', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'PL', 'GR'].includes(code)) {
    return {
      cuisineAnchor: 'weeknight_comfort',
      cuisineLabel: 'British & European Comfort',
      cookingGear: 'one_pan',
      cookingGearLabel: '1 Pan & Stovetop',
    };
  }
  // North America & Western
  if (['US', 'CA', 'AU', 'NZ'].includes(code)) {
    return {
      cuisineAnchor: 'weeknight_comfort',
      cuisineLabel: 'Everyday Comfort & Classics',
      cookingGear: 'one_pan',
      cookingGearLabel: '1 Pan & Stovetop',
    };
  }
  // Island & Caribbean
  if (['JM', 'TT', 'BB', 'BS', 'GD', 'LC', 'PR', 'DO', 'HT', 'CU', 'FJ'].includes(code)) {
    return {
      cuisineAnchor: 'african_caribbean',
      cuisineLabel: 'Island & Caribbean Soul',
      cookingGear: 'one_pan',
      cookingGearLabel: '1 Pan & Burner',
    };
  }
  // Asia
  if (['CN', 'JP', 'KR', 'IN', 'PH', 'SG', 'MY', 'TH', 'VN', 'ID', 'PK', 'BD', 'LK', 'TW', 'HK', 'AE', 'SA'].includes(code)) {
    return {
      cuisineAnchor: 'weeknight_comfort',
      cuisineLabel: 'Asian Fresh & Stir-Fry',
      cookingGear: 'one_pan',
      cookingGearLabel: '1 Wok / Pan',
    };
  }
  // Africa (Default Mama)
  return {
    cuisineAnchor: 'african_caribbean',
    cuisineLabel: 'African & Caribbean Heritage',
    cookingGear: 'one_pan',
    cookingGearLabel: '1 Pan & Burner',
  };
}

export type BodyGoal = 'balanced' | 'curves_glutes' | 'reduce_weight' | 'add_weight';

export const BODY_GOAL_CONFIG: Record<
  BodyGoal,
  { label: string; description: string; emphasis: string }
> = {
  balanced: {
    label: 'Balanced Energy',
    description: 'Everyday wholesome fuel to keep you energized',
    emphasis: 'Balanced proteins, fresh veggies, and hearty staples',
  },
  curves_glutes: {
    label: 'Curves & Glutes (Hips & Body)',
    description: 'High protein + complex energy carbs for healthy curves',
    emphasis: 'Plenty of boiled eggs, beans, sweet plantains, yam & chicken',
  },
  reduce_weight: {
    label: 'Lean & Light (Weight Loss)',
    description: 'High protein, lighter oils, and plenty of fresh vegetables',
    emphasis: 'Light pepper soups, leafy greens, grilled fish & lean poultry',
  },
  add_weight: {
    label: 'Gain Weight & Fullness (Healthy Bulk)',
    description: 'Hearty calorie-dense portions of yam, rice, dodo, and stew',
    emphasis: 'Calorie-rich beans & plantains, jollof rice, yam porridge & oats',
  },
};

export interface UserKitchenPass {
  country: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  weeklyBudget: number;
  spentThisWeek: number;
  remainingDaysInWeek: number;
  cuisineAnchor: string;
  cuisineLabel: string;
  cookingGear: string;
  cookingGearLabel: string;
  timeLimitMinutes: number;
  timeLimitLabel: string;
  stapleBase: string;
  stapleBaseLabel: string;
  dietaryRestrictions: string[];
  spiceLevel: 'mild' | 'warm' | 'hot';
  spiceLabel: string;
  bodyGoal: BodyGoal;
  bodyGoalLabel: string;
  hasCompletedOnboarding: boolean;
  likedDishes: string[];
  passedDishes: string[];
  neverShowDishes: string[];
  shakeToRollEnabled: boolean;
  weekStartKey?: string;
  xpBalance?: number;
  planTier?: 'free' | 'plus';
  dailyRollsCount?: number;
  dailyRollsDateKey?: string;
}

function getTodayDateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function calculateRemainingDays(): number {
  const day = new Date().getDay(); // 0 = Sunday, 1 = Monday...
  return day === 0 ? 1 : 7 - day;
}

function getCurrentMondayKey(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeWeeklyBudgetReset(pass: UserKitchenPass): UserKitchenPass {
  const currentMonday = getCurrentMondayKey();
  let spentThisWeek = typeof pass.spentThisWeek === 'number' && Number.isFinite(pass.spentThisWeek) ? pass.spentThisWeek : 0;
  // Auto-heal any runaway or corrupt spent values from previous versions (> 1.5x budget or runaway millions)
  if (spentThisWeek > (pass.weeklyBudget || 35000) * 1.5 || spentThisWeek > 150000) {
    spentThisWeek = 0;
  }
  if (pass.weekStartKey && pass.weekStartKey !== currentMonday) {
    return {
      ...pass,
      spentThisWeek: 0,
      weekStartKey: currentMonday,
      remainingDaysInWeek: calculateRemainingDays(),
    };
  }
  return {
    ...pass,
    spentThisWeek,
    weekStartKey: currentMonday,
    remainingDaysInWeek: calculateRemainingDays(),
  };
}

const DEFAULT_KITCHEN_PASS: UserKitchenPass = {
  country: 'NG',
  countryName: 'Nigeria',
  currencyCode: 'NGN',
  currencySymbol: '₦',
  weeklyBudget: 35000,
  spentThisWeek: 0,
  remainingDaysInWeek: calculateRemainingDays(),
  cuisineAnchor: 'african_caribbean',
  cuisineLabel: 'African & Caribbean Comfort',
  cookingGear: 'one_pan',
  cookingGearLabel: '1 Pan & Burner (Zero Extra Dishes)',
  timeLimitMinutes: 12,
  timeLimitLabel: 'Under 15 mins (Tired Evening)',
  stapleBase: 'rice',
  stapleBaseLabel: 'Rice & Grains',
  dietaryRestrictions: [],
  spiceLevel: 'warm',
  spiceLabel: 'Warm Kick (Black Pepper & Chili Flakes)',
  bodyGoal: 'balanced',
  bodyGoalLabel: 'Balanced Energy',
  hasCompletedOnboarding: false,
  likedDishes: [],
  passedDishes: [],
  neverShowDishes: [],
  shakeToRollEnabled: true,
  weekStartKey: getCurrentMondayKey(),
  xpBalance: 100,
  planTier: 'free',
  dailyRollsCount: 0,
  dailyRollsDateKey: getTodayDateKey(),
};

let currentKitchenPass: UserKitchenPass = { ...DEFAULT_KITCHEN_PASS };
const listeners = new Set<(pass: UserKitchenPass) => void>();

export function formatCurrency(
  amount: number,
  currencySymbol: string = '₦',
  currencyCode: string = 'NGN'
): string {
  if (['NGN', 'KES', 'ZAR', 'GHS'].includes(currencyCode) || amount >= 500) {
    const rounded = Math.round(amount);
    return `${currencySymbol}${rounded.toLocaleString()}`;
  }
  return `${currencySymbol}${amount.toFixed(2)}`;
}

/**
 * Safely computes the localized cost of a meal.
 * Handles both base USD costs (< 50) and already-localized amounts (> 50) cleanly.
 */
export function getMealCostInCurrency(cost: number, currencyCode: string = 'NGN'): number {
  const safeCost = typeof cost === 'number' && Number.isFinite(cost) && cost > 0 ? cost : 2.0;
  if (currencyCode === 'NGN') {
    return safeCost > 50 ? Math.min(Math.round(safeCost / 100) * 100, 8000) : Math.round((safeCost * 1400) / 100) * 100;
  }
  if (currencyCode === 'KES') {
    return safeCost > 40 ? Math.min(Math.round(safeCost / 10) * 10, 1500) : Math.round((safeCost * 130) / 10) * 10;
  }
  if (currencyCode === 'GHS') {
    return safeCost > 20 ? Math.min(Math.round(safeCost), 200) : Math.round(safeCost * 15);
  }
  if (currencyCode === 'ZAR') {
    return safeCost > 30 ? Math.min(Math.round(safeCost), 250) : Math.round(safeCost * 18);
  }
  if (currencyCode === 'GBP') {
    return safeCost > 20 ? safeCost : Number((safeCost * 0.79).toFixed(2));
  }
  if (currencyCode === 'EUR') {
    return safeCost > 20 ? safeCost : Number((safeCost * 0.92).toFixed(2));
  }
  if (currencyCode === 'CAD') {
    return safeCost > 20 ? safeCost : Number((safeCost * 1.36).toFixed(2));
  }
  if (currencyCode === 'AUD') {
    return safeCost > 20 ? safeCost : Number((safeCost * 1.52).toFixed(2));
  }
  return safeCost > 30 ? safeCost : Number(safeCost.toFixed(2));
}

/**
 * Converts a meal price into the user's localized currency formatted string
 */
export function convertMealCost(
  cost: number,
  currencyCode: string = 'NGN',
  currencySymbol: string = '₦'
): string {
  const localizedAmount = getMealCostInCurrency(cost, currencyCode);
  return formatCurrency(localizedAmount, currencySymbol, currencyCode);
}

export const FREE_DAILY_ROLL_LIMIT = 2;

export const preferencesStore = {
  getKitchenPass(): UserKitchenPass {
    return currentKitchenPass;
  },

  hasCompletedOnboarding(): boolean {
    return !!currentKitchenPass.hasCompletedOnboarding;
  },

  async init(): Promise<void> {
    try {
      // 1. Restore this user's local data bank first (isolated per user ID or guest)
      const local = await loadPassFromStorage();
      if (local) {
        currentKitchenPass = normalizeWeeklyBudgetReset({
          ...DEFAULT_KITCHEN_PASS,
          ...local,
        });
      } else {
        currentKitchenPass = normalizeWeeklyBudgetReset({
          ...DEFAULT_KITCHEN_PASS,
          hasCompletedOnboarding: tokenStore.isLoggedIn(),
        });
      }
      savePassToStorage(currentKitchenPass);
      listeners.forEach((listener) => listener(currentKitchenPass));

      // 2. If user is authenticated, sync with their remote Neon DB bank
      if (tokenStore.isLoggedIn()) {
        const dbPrefs = await userPreferencesService.fetchFromDb();
        if (dbPrefs) {
          currentKitchenPass = normalizeWeeklyBudgetReset({
            ...currentKitchenPass,
            ...dbPrefs,
            hasCompletedOnboarding: true,
          });
          savePassToStorage(currentKitchenPass);
          listeners.forEach((listener) => listener(currentKitchenPass));
        }
      }
    } catch {
      // offline / fallback
    }
  },

  async initFromDb(): Promise<void> {
    await this.init();
  },

  updateKitchenPass(updates: Partial<UserKitchenPass>): UserKitchenPass {
    currentKitchenPass = {
      ...currentKitchenPass,
      ...updates,
    };
    listeners.forEach((listener) => listener(currentKitchenPass));
    // Persist locally immediately
    savePassToStorage(currentKitchenPass);
    // Persist to Neon DB asynchronously (fire-and-forget)
    userPreferencesService.syncToDb(currentKitchenPass);
    return currentKitchenPass;
  },

  completeOnboarding(): UserKitchenPass {
    return this.updateKitchenPass({ hasCompletedOnboarding: true });
  },

  updateCountryAndCurrency(
    countryId: string,
    customCurrencyCode?: string,
    customWeeklyBudget?: number,
    syncCuisineToCountry: boolean = false
  ): UserKitchenPass {
    const foundCountry = SUPPORTED_COUNTRIES.find((c) => c.id === countryId);
    const countryChanged = countryId !== currentKitchenPass.country;

    const countryName = foundCountry ? foundCountry.name : countryId;
    const currencyCode =
      customCurrencyCode || (foundCountry ? foundCountry.currencyCode : currentKitchenPass.currencyCode);
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
    const currencySymbol = currency ? currency.symbol : foundCountry ? foundCountry.currencySymbol : '$';

    const defaultBudget = foundCountry ? foundCountry.defaultWeeklyBudget : 85;
    const weeklyBudget = customWeeklyBudget ?? defaultBudget;
    // Scale logged spend proportionally when switching between currencies so ₦2,500 never becomes £2,500
    let spentThisWeek = currentKitchenPass.spentThisWeek || 0;
    if (currencyCode !== currentKitchenPass.currencyCode && spentThisWeek > 0) {
      const oldBudget = currentKitchenPass.weeklyBudget || 1;
      const ratio = Math.min(1, Math.max(0, spentThisWeek / oldBudget));
      const scaled = ratio * weeklyBudget;
      spentThisWeek = ['NGN', 'KES', 'ZAR', 'GHS'].includes(currencyCode)
        ? Math.round(scaled)
        : Number(scaled.toFixed(2));
    }

    const mamaProfile = getMamaProfileForCountry(countryId);

    return this.updateKitchenPass({
      country: countryId,
      countryName,
      currencyCode,
      currencySymbol,
      weeklyBudget,
      spentThisWeek,
      ...(countryChanged || syncCuisineToCountry
        ? {
            cuisineAnchor: mamaProfile.cuisineAnchor,
            cuisineLabel: mamaProfile.cuisineLabel,
          }
        : {}),
    });
  },

  recordMealDecision(dishId: string, action: 'cooked' | 'passed' | 'saved', mealCostUsd: number = 2.5): UserKitchenPass {
    const isCooked = action === 'cooked';
    const isSaved = action === 'saved';
    const isPassed = action === 'passed';

    const likedDishes = (isCooked || isSaved)
      ? [...new Set([...currentKitchenPass.likedDishes, dishId])]
      : currentKitchenPass.likedDishes;
    const passedDishes = isPassed
      ? [...new Set([...currentKitchenPass.passedDishes, dishId])]
      : currentKitchenPass.passedDishes;

    let newSpent = currentKitchenPass.spentThisWeek;
    const currentXp =
      typeof currentKitchenPass.xpBalance === 'number'
        ? currentKitchenPass.xpBalance
        : (currentKitchenPass.likedDishes || []).length * 50 + 100;
    let nextXp = currentXp;
    if (isCooked) {
      const costInLocalCurrency = getMealCostInCurrency(mealCostUsd, currentKitchenPass.currencyCode);
      newSpent = Math.min(currentKitchenPass.weeklyBudget, currentKitchenPass.spentThisWeek + costInLocalCurrency);
      const xpReward = currentKitchenPass.planTier === 'plus' ? 100 : 50;
      nextXp = currentXp + xpReward;
    }

    return this.updateKitchenPass({
      likedDishes,
      passedDishes,
      spentThisWeek: newSpent,
      xpBalance: nextXp,
    });
  },

  getXpBalance(): number {
    if (typeof currentKitchenPass.xpBalance === 'number') {
      return currentKitchenPass.xpBalance;
    }
    return (currentKitchenPass.likedDishes || []).length * 50 + 100;
  },

  spendXp(amount: number): boolean {
    const currentXp = this.getXpBalance();
    if (currentXp < amount) return false;
    this.updateKitchenPass({ xpBalance: currentXp - amount });
    return true;
  },

  isMamaPlus(): boolean {
    return currentKitchenPass.planTier === 'plus';
  },

  setPlanTier(tier: 'free' | 'plus'): UserKitchenPass {
    return this.updateKitchenPass({ planTier: tier });
  },

  getRemainingDailyRolls(): number {
    if (currentKitchenPass.planTier === 'plus') return 999;
    const today = getTodayDateKey();
    const usedToday =
      currentKitchenPass.dailyRollsDateKey === today
        ? currentKitchenPass.dailyRollsCount || 0
        : 0;
    return Math.max(0, FREE_DAILY_ROLL_LIMIT - usedToday);
  },

  consumeDailyRoll(): boolean {
    if (currentKitchenPass.planTier === 'plus') return true;
    const today = getTodayDateKey();
    const usedToday =
      currentKitchenPass.dailyRollsDateKey === today
        ? currentKitchenPass.dailyRollsCount || 0
        : 0;
    if (usedToday >= FREE_DAILY_ROLL_LIMIT) return false;
    this.updateKitchenPass({
      dailyRollsCount: usedToday + 1,
      dailyRollsDateKey: today,
    });
    return true;
  },

  getLocalizedPlusPrice(): string {
    const code = currentKitchenPass.currencyCode || 'USD';
    if (code === 'NGN') return '₦1,500/mo';
    if (code === 'GBP') return '£0.99/mo';
    if (code === 'EUR') return '€0.99/mo';
    if (code === 'GHS') return 'GH₵15/mo';
    if (code === 'KES') return 'KSh130/mo';
    if (code === 'ZAR') return 'R19/mo';
    if (code === 'CAD') return 'CA$1.49/mo';
    if (code === 'AUD') return 'A$1.49/mo';
    return '$1/mo';
  },

  addNeverShowDish(dishTitleOrId: string): UserKitchenPass {
    const neverShowDishes = [
      ...new Set([...(currentKitchenPass.neverShowDishes || []), dishTitleOrId]),
    ];
    // Also remove from liked dishes if present
    const likedDishes = currentKitchenPass.likedDishes.filter(
      (id) => id.toLowerCase() !== dishTitleOrId.toLowerCase()
    );
    return this.updateKitchenPass({ neverShowDishes, likedDishes });
  },

  removeNeverShowDish(dishTitleOrId: string): UserKitchenPass {
    const neverShowDishes = (currentKitchenPass.neverShowDishes || []).filter(
      (d) => d.toLowerCase() !== dishTitleOrId.toLowerCase()
    );
    return this.updateKitchenPass({ neverShowDishes });
  },

  undoMealDecision(dishId: string, action: 'passed' | 'cooked', mealCostUsd: number = 2.5): UserKitchenPass {
    const isCooked = action === 'cooked';
    const isPassed = action === 'passed';

    const likedDishes = isCooked
      ? currentKitchenPass.likedDishes.filter((id) => id !== dishId)
      : currentKitchenPass.likedDishes;
    const passedDishes = isPassed
      ? currentKitchenPass.passedDishes.filter((id) => id !== dishId)
      : currentKitchenPass.passedDishes;

    let newSpent = currentKitchenPass.spentThisWeek;
    if (isCooked) {
      const costInLocalCurrency = getMealCostInCurrency(mealCostUsd, currentKitchenPass.currencyCode);
      newSpent = Math.max(0, currentKitchenPass.spentThisWeek - costInLocalCurrency);
    }

    return this.updateKitchenPass({
      likedDishes,
      passedDishes,
      spentThisWeek: newSpent,
    });
  },

  setShakeToRollEnabled(enabled: boolean): UserKitchenPass {
    return this.updateKitchenPass({ shakeToRollEnabled: enabled });
  },

  setBodyGoal(goal: BodyGoal): UserKitchenPass {
    const config = BODY_GOAL_CONFIG[goal];
    return this.updateKitchenPass({
      bodyGoal: goal,
      bodyGoalLabel: config ? config.label : 'Balanced Energy',
    });
  },

  subscribe(listener: (pass: UserKitchenPass) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  reset(): void {
    currentKitchenPass = { ...DEFAULT_KITCHEN_PASS };
    listeners.forEach((listener) => listener(currentKitchenPass));
    savePassToStorage(currentKitchenPass);
  },
};
