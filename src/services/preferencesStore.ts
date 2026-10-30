/**
 * User Kitchen Pass Store
 * Persists the user's culinary DNA, kitchen equipment, country, currency, and weekly budget.
 */

import { userPreferencesService } from './api/userPreferencesService';

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
  hasCompletedOnboarding: boolean;
  likedDishes: string[];
  passedDishes: string[];
}

function calculateRemainingDays(): number {
  const day = new Date().getDay(); // 0 = Sunday, 1 = Monday...
  return day === 0 ? 1 : 7 - day;
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
  hasCompletedOnboarding: false,
  likedDishes: [],
  passedDishes: [],
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
 * Converts a base USD meal price into the user's localized currency equivalent
 */
export function convertMealCost(
  baseUsdCost: number,
  currencyCode: string = 'NGN',
  currencySymbol: string = '₦'
): string {
  switch (currencyCode) {
    case 'NGN': {
      const ngn = Math.round((baseUsdCost * 1400) / 100) * 100;
      return `${currencySymbol}${ngn.toLocaleString()}`;
    }
    case 'GBP': {
      const gbp = baseUsdCost * 0.79;
      return `${currencySymbol}${gbp.toFixed(2)}`;
    }
    case 'EUR': {
      const eur = baseUsdCost * 0.92;
      return `${currencySymbol}${eur.toFixed(2)}`;
    }
    case 'CAD': {
      const cad = baseUsdCost * 1.36;
      return `${currencySymbol}${cad.toFixed(2)}`;
    }
    case 'GHS': {
      const ghs = Math.round(baseUsdCost * 15);
      return `${currencySymbol}${ghs}`;
    }
    case 'KES': {
      const kes = Math.round((baseUsdCost * 130) / 10) * 10;
      return `${currencySymbol}${kes.toLocaleString()}`;
    }
    case 'ZAR': {
      const zar = Math.round(baseUsdCost * 18);
      return `${currencySymbol}${zar}`;
    }
    case 'AUD': {
      const aud = baseUsdCost * 1.52;
      return `${currencySymbol}${aud.toFixed(2)}`;
    }
    default:
      return `${currencySymbol}${baseUsdCost.toFixed(2)}`;
  }
}

export const preferencesStore = {
  getKitchenPass(): UserKitchenPass {
    return currentKitchenPass;
  },

  async initFromDb(): Promise<void> {
    try {
      const dbPrefs = await userPreferencesService.fetchFromDb();
      if (dbPrefs) {
        currentKitchenPass = {
          ...currentKitchenPass,
          ...dbPrefs,
          remainingDaysInWeek: calculateRemainingDays(),
        };
        listeners.forEach((listener) => listener(currentKitchenPass));
      }
    } catch {
      // offline / fallback
    }
  },

  updateKitchenPass(updates: Partial<UserKitchenPass>): UserKitchenPass {
    currentKitchenPass = {
      ...currentKitchenPass,
      ...updates,
    };
    listeners.forEach((listener) => listener(currentKitchenPass));
    // Persist to Neon DB asynchronously (fire-and-forget)
    userPreferencesService.syncToDb(currentKitchenPass);
    return currentKitchenPass;
  },

  updateCountryAndCurrency(
    countryId: string,
    customCurrencyCode?: string,
    customWeeklyBudget?: number
  ): UserKitchenPass {
    const foundCountry = SUPPORTED_COUNTRIES.find((c) => c.id === countryId);

    const countryName = foundCountry ? foundCountry.name : countryId;
    const currencyCode =
      customCurrencyCode || (foundCountry ? foundCountry.currencyCode : currentKitchenPass.currencyCode);
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
    const currencySymbol = currency ? currency.symbol : foundCountry ? foundCountry.currencySymbol : '$';

    const defaultBudget = foundCountry ? foundCountry.defaultWeeklyBudget : 85;
    const weeklyBudget = customWeeklyBudget ?? defaultBudget;
    // Preserve actual logged spend, never fabricate a mock spend
    const spentThisWeek = currentKitchenPass.spentThisWeek || 0;

    return this.updateKitchenPass({
      country: countryId,
      countryName,
      currencyCode,
      currencySymbol,
      weeklyBudget,
      spentThisWeek,
    });
  },

  recordMealDecision(dishId: string, action: 'cooked' | 'passed', mealCostUsd: number = 2.5): UserKitchenPass {
    const isCooked = action === 'cooked';
    const likedDishes = isCooked
      ? [...new Set([...currentKitchenPass.likedDishes, dishId])]
      : currentKitchenPass.likedDishes;
    const passedDishes = !isCooked
      ? [...new Set([...currentKitchenPass.passedDishes, dishId])]
      : currentKitchenPass.passedDishes;

    let newSpent = currentKitchenPass.spentThisWeek;
    if (isCooked) {
      // Calculate localized meal cost
      let costInLocalCurrency = mealCostUsd;
      if (currentKitchenPass.currencyCode === 'NGN') costInLocalCurrency = mealCostUsd * 1400;
      else if (currentKitchenPass.currencyCode === 'KES') costInLocalCurrency = mealCostUsd * 130;
      else if (currentKitchenPass.currencyCode === 'GHS') costInLocalCurrency = mealCostUsd * 15;
      else if (currentKitchenPass.currencyCode === 'GBP') costInLocalCurrency = mealCostUsd * 0.79;
      else if (currentKitchenPass.currencyCode === 'EUR') costInLocalCurrency = mealCostUsd * 0.92;

      newSpent = Math.min(currentKitchenPass.weeklyBudget, currentKitchenPass.spentThisWeek + costInLocalCurrency);
    }

    return this.updateKitchenPass({
      likedDishes,
      passedDishes,
      spentThisWeek: newSpent,
    });
  },

  subscribe(listener: (pass: UserKitchenPass) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  reset(): void {
    currentKitchenPass = { ...DEFAULT_KITCHEN_PASS };
    listeners.forEach((listener) => listener(currentKitchenPass));
  },
};
