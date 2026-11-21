import { pantryService } from './pantryService';
import { aiMealCache } from './aiMealCache';
import { preferencesStore, UserKitchenPass } from '../preferencesStore';
import { AiMamaService, sanitizeDishTitle, textMentionsPantryItem } from '../aiMamaService';
import { MealImageService } from '../mealImageService';

export interface RolledMeal {
  id: string;
  title: string;
  subtitle: string;
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night';
  cookTimeMinutes: number;
  estCost: number;
  pantryNote?: string;
  mamaTip?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoCover?: string;
  videoAuthor?: {
    nickname: string;
    unique_id: string;
    avatar?: string;
  };
  ingredients: { name: string; amount: string }[];
  steps: string[];
  /** 'ai' = generated live by Mama AI. 'catalog' = built-in fallback when the AI was unreachable. */
  source?: 'ai' | 'catalog';
  /** Region / cuisine metadata so cached AI meals never bleed across continents */
  country?: string;
  cuisineAnchor?: string;
}

export function getCurrentTimeOfDay(): 'morning' | 'lunch' | 'dinner' | 'late_night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'late_night';
}

export function getTimeOfDayHeading(timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night'): string {
  switch (timeOfDay) {
    case 'morning':
      return 'Morning Plate';
    case 'lunch':
      return 'Midday Fuel';
    case 'dinner':
      return 'Evening Meal';
    case 'late_night':
      return 'Late Night Fix';
  }
}

const sessionPassedTitles: string[] = [];

type TimeOfDay = 'morning' | 'lunch' | 'dinner' | 'late_night';

const MEAT_TERMS = [
  'chicken',
  'beef',
  'fish',
  'tuna',
  'sausage',
  'sardine',
  'mackerel',
  'meat',
  'bacon',
  'pork',
  'gizzard',
  'steak',
  'shrimp',
  'prawn',
  'salmon',
  'corned beef',
  'turkey',
  'goat',
  'crayfish',
];
const NON_VEGAN_TERMS = [...MEAT_TERMS, 'egg', 'cheese', 'milk', 'butter', 'honey', 'cheddar', 'cream', 'parmesan', 'yogurt'];
const DAIRY_TERMS = ['cheese', 'milk', 'butter', 'cheddar', 'cream', 'parmesan', 'mozzarella', 'yogurt'];
const GLUTEN_TERMS = ['bread', 'spaghetti', 'pasta', 'indomie', 'noodles', 'sourdough', 'rigatoni', 'fettuccine', 'flour', 'tortillas', 'toast', 'semovita'];
const NON_HALAL_TERMS = ['pork', 'bacon', 'ham ', 'wine', 'beer'];

/**
 * True when the meal contains nothing the user's dietary restrictions forbid.
 * Used for both the built-in catalog and AI-generated meals.
 */
export function isMealDietCompliant(meal: RolledMeal, pass: UserKitchenPass): boolean {
  const diets = (pass.dietaryRestrictions || []).map((d) => d.toLowerCase().trim());
  if (diets.length === 0 || (diets.length === 1 && (diets[0] === 'no preference' || diets[0] === 'none'))) {
    return true;
  }
  const isVegan = diets.some((d) => d.includes('vegan'));
  const isVegetarian = isVegan || diets.some((d) => d.includes('vegetarian'));
  const isDairyFree = diets.some((d) => d.includes('dairy'));
  const isGlutenFree = diets.some((d) => d.includes('gluten'));
  const isHalal = diets.some((d) => d.includes('halal'));

  const text = `${meal.title} ${meal.subtitle} ${meal.ingredients.map((i) => i.name).join(' ')} `.toLowerCase();
  if (isVegan && NON_VEGAN_TERMS.some((t) => text.includes(t))) return false;
  if (isVegetarian && MEAT_TERMS.some((t) => text.includes(t))) return false;
  if (isDairyFree && DAIRY_TERMS.some((t) => text.includes(t))) return false;
  if (isGlutenFree && GLUTEN_TERMS.some((t) => text.includes(t))) return false;
  if (isHalal && NON_HALAL_TERMS.some((t) => text.includes(t))) return false;

  // Enforce any custom user-entered dietary restriction or allergy (e.g. "no peanut", "no okra", "shellfish")
  const standardIds = ['none', 'no preference', 'vegan', 'vegetarian', 'dairy_free', 'dairy-free', 'gluten_free', 'gluten-free', 'halal', 'gluten_or_dairy'];
  const customRestrictions = diets.filter((d) => !standardIds.includes(d));
  for (const custom of customRestrictions) {
    const cleaned = custom
      .replace(/\b(no|without|avoid|allergy|allergic to|free)\b/g, '')
      .trim();
    if (cleaned.length >= 3 && text.includes(cleaned)) {
      return false;
    }
  }
  return true;
}

// ==========================================
// AI ROLL (backend /api/roll) WITH PREFETCH
// ==========================================
// Total time a roll will wait for the live AI before falling back. Groq usually answers in
// 1-3s; the old 7s cap was shorter than the AI call's own timeout + backend fallback,
// so slow rolls were silently replaced by catalog meals.
const AI_DIRECT_TIMEOUT_MS = 16000;
const AI_PREFETCH_TIMEOUT_MS = 16000;

let prefetchedMeal: { key: string; meal: RolledMeal } | null = null;
let prefetchInFlight: { key: string; promise: Promise<RolledMeal | null> } | null = null;

function buildPrefsKey(timeOfDay: TimeOfDay, pass: UserKitchenPass, pantryItems: string[] = []): string {
  const pantrySig = [...pantryItems]
    .map((p) => p.toLowerCase().trim())
    .sort()
    .join(',');
  return [
    timeOfDay,
    pass.country,
    pass.cuisineAnchor,
    pass.cookingGear,
    pass.timeLimitMinutes,
    pass.bodyGoal,
    (pass.dietaryRestrictions || []).join(','),
    pantrySig,
  ].join('|');
}

function toLowerList(values: string[]): string[] {
  return values.map((v) => v.toLowerCase());
}

/** Validate and normalise a raw /api/roll response into a safe RolledMeal */
function normaliseAiMeal(raw: any, timeOfDay: TimeOfDay, pass: UserKitchenPass): RolledMeal | null {
  if (!raw || typeof raw.title !== 'string' || !Array.isArray(raw.steps) || raw.steps.length === 0) {
    return null;
  }
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients
        .filter((i: any) => i && typeof i.name === 'string')
        .map((i: any) => ({ name: String(i.name), amount: String(i.amount ?? 'to taste') }))
    : [];
  if (ingredients.length === 0) return null;

  const title = sanitizeDishTitle(raw.title);
  if (!title) return null;

  const cookTime = Number(raw.cookTimeMinutes);
  let estCost = Number(raw.estCost);
  if (!Number.isFinite(estCost) || estCost <= 0) {
    estCost = 2.0;
  } else if (estCost > 50) {
    // If the model or backend returned local currency (e.g. 2000 NGN), normalize to base USD
    estCost = Math.max(1.0, Math.min(4.0, Number((estCost / 1400).toFixed(2))));
  }

  const meal: RolledMeal = {
    id: `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    timeOfDay,
    cookTimeMinutes: Number.isFinite(cookTime) && cookTime > 0 ? Math.min(Math.round(cookTime), 90) : 15,
    estCost,
    pantryNote: typeof raw.pantryNote === 'string' ? raw.pantryNote : undefined,
    mamaTip: typeof raw.mamaTip === 'string' ? raw.mamaTip : undefined,
    imageUrl: MealImageService.resolveMealImage(title, ingredients, pass.cuisineAnchor),
    ingredients,
    steps: raw.steps.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0),
    source: 'ai',
    country: pass.country,
    cuisineAnchor: pass.cuisineAnchor,
  };

  if (meal.steps.length === 0) return null;
  if (!isMealDietCompliant(meal, pass)) return null;
  return meal;
}

async function requestAiMeal(
  timeOfDay: TimeOfDay,
  pass: UserKitchenPass,
  pantryItems: string[],
  passedTitles: string[],
  _recentCookedTitles: string[],
  _timeoutMs: number
): Promise<RolledMeal | null> {
  try {
    // Only steer the AI away from the built-in catalog when the pantry is empty (to add variety).
    // When the user HAS pantry items, the best match is often a classic catalog dish
    // (e.g. rice + chicken -> Fried Rice & Chicken), so we must not forbid it.
    const catalogTitles =
      pantryItems.length === 0
        ? getFilteredCatalogMeals(timeOfDay, pass, false).map((m) => m.title).slice(0, 8)
        : [];
    const aiAvoidTitles = Array.from(new Set([...passedTitles.slice(-20), ...catalogTitles]));

    // Groq first; rollMealWithAI already falls back to backend /api/roll internally,
    // so we do not call /api/roll a second time here (that doubled the wait on cold starts).
    const directAi = await AiMamaService.rollMealWithAI(timeOfDay, pass, pantryItems, aiAvoidTitles);
    return normaliseAiMeal(directAi, timeOfDay, pass);
  } catch {
    return null;
  }
}

function startPrefetch(
  timeOfDay: TimeOfDay,
  pass: UserKitchenPass,
  pantryItems: string[],
  passedTitles: string[],
  recentCookedTitles: string[]
): void {
  const key = buildPrefsKey(timeOfDay, pass, pantryItems);
  if (prefetchedMeal?.key === key || prefetchInFlight?.key === key) return;

  const promise = requestAiMeal(
    timeOfDay,
    pass,
    pantryItems,
    passedTitles,
    recentCookedTitles,
    AI_PREFETCH_TIMEOUT_MS
  ).then((meal) => {
    if (prefetchInFlight?.promise === promise) prefetchInFlight = null;
    if (meal) {
      prefetchedMeal = { key, meal };
      aiMealCache.add(meal).catch(() => {});
    }
    return meal;
  });
  prefetchInFlight = { key, promise };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function getFilteredCatalogMeals(
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night',
  currentPass: UserKitchenPass,
  includeAdjacentPeriods: boolean = false
): RolledMeal[] {
  const anchor = currentPass.cuisineAnchor;
  const allPeriods: ('morning' | 'lunch' | 'dinner' | 'late_night')[] = [
    'morning',
    'lunch',
    'dinner',
    'late_night',
  ];
  const otherPeriods = allPeriods.filter((p) => p !== timeOfDay);

  const isWesternCountry = [
    'GB',
    'UK',
    'US',
    'CA',
    'EU',
    'AU',
    'NZ',
    'FR',
    'DE',
    'IT',
    'ES',
    'NL',
    'IE',
    'PT',
    'BE',
    'CH',
    'AT',
    'SE',
    'NO',
    'DK',
    'PL',
    'GR',
  ].includes((currentPass.country || '').toUpperCase());

  let primaryList: RolledMeal[] = [];
  let adjacentList: RolledMeal[] = [];

  if (anchor === 'african_caribbean') {
    primaryList = [...(EVERYDAY_MEALS[timeOfDay] || EVERYDAY_MEALS.dinner)];
    if (includeAdjacentPeriods) {
      adjacentList = otherPeriods.flatMap((p) => EVERYDAY_MEALS[p] || []);
    }
  } else if (anchor === 'weeknight_comfort') {
    primaryList = [...(EVERYDAY_MEALS_COMFORT[timeOfDay] || EVERYDAY_MEALS_COMFORT.dinner)];
    if (includeAdjacentPeriods) {
      adjacentList = otherPeriods.flatMap((p) => EVERYDAY_MEALS_COMFORT[p] || []);
    }
  } else if (anchor === 'global') {
    primaryList = [
      ...(EVERYDAY_MEALS[timeOfDay] || EVERYDAY_MEALS.dinner),
      ...(EVERYDAY_MEALS_COMFORT[timeOfDay] || EVERYDAY_MEALS_COMFORT.dinner),
    ];
    if (includeAdjacentPeriods) {
      adjacentList = otherPeriods.flatMap((p) => [
        ...(EVERYDAY_MEALS[p] || []),
        ...(EVERYDAY_MEALS_COMFORT[p] || []),
      ]);
    }
  } else {
    const catalog = isWesternCountry ? EVERYDAY_MEALS_COMFORT : EVERYDAY_MEALS;
    primaryList = [...(catalog[timeOfDay] || catalog.dinner)];
    if (includeAdjacentPeriods) {
      adjacentList = otherPeriods.flatMap((p) => catalog[p] || []);
    }
  }

  let candidateMeals = includeAdjacentPeriods
    ? [...primaryList, ...adjacentList]
    : [...primaryList];

  // 1. Filter out permanently hidden dishes
  const neverShow = (currentPass.neverShowDishes || []).map((t) => t.toLowerCase());
  if (neverShow.length > 0) {
    const allowed = candidateMeals.filter((m) => !neverShow.includes(m.title.toLowerCase()));
    if (allowed.length > 0) {
      candidateMeals = allowed;
    }
  }

  // 2. Filter strictly by dietary restrictions (expand ONLY within the same Mama's catalog)
  let compliant = candidateMeals.filter((m) => isMealDietCompliant(m, currentPass));
  if (compliant.length === 0 && !includeAdjacentPeriods) {
    const fallbackAdjacent =
      anchor === 'global'
        ? otherPeriods.flatMap((p) => [
            ...(EVERYDAY_MEALS[p] || []),
            ...(EVERYDAY_MEALS_COMFORT[p] || []),
          ])
        : otherPeriods.flatMap((p) => {
            const regionalCatalog =
              anchor === 'weeknight_comfort' || (anchor !== 'african_caribbean' && isWesternCountry)
                ? EVERYDAY_MEALS_COMFORT
                : EVERYDAY_MEALS;
            return regionalCatalog[p] || [];
          });
    compliant = [...primaryList, ...fallbackAdjacent].filter((m) =>
      isMealDietCompliant(m, currentPass)
    );
  }
  if (compliant.length > 0) {
    candidateMeals = compliant;
  }

  // 3. Respect cooking time preference only when a large pool remains (never shrink to a tiny repeating list)
  const maxTime = Math.max(currentPass.timeLimitMinutes || 25, 22);
  const withinTime = candidateMeals.filter((m) => m.cookTimeMinutes <= maxTime + 5);
  if (withinTime.length >= 10) {
    candidateMeals = withinTime;
  }

  return candidateMeals;
}

export function getInitialMeal(
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night',
  pass?: UserKitchenPass
): RolledMeal {
  const currentPass = pass || preferencesStore.getKitchenPass();
  const pool = getFilteredCatalogMeals(timeOfDay, currentPass, false);
  const unpassed = pool.filter((m) => !sessionPassedTitles.includes(m.title));
  const candidatePool = unpassed.length > 0 ? unpassed : pool;

  // Goal-aware priority for initial launch meal
  let finalPool = candidatePool;
  if (currentPass.bodyGoal && currentPass.bodyGoal !== 'balanced') {
    const goal = currentPass.bodyGoal;
    const goalMatches = candidatePool.filter((m) => {
      const text = `${m.title} ${m.subtitle} ${m.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();
      if (goal === 'curves_glutes') {
        return ['egg', 'beans', 'plantain', 'dodo', 'yam', 'chicken', 'tuna', 'oats', 'fish'].some((s) => text.includes(s));
      }
      if (goal === 'reduce_weight') {
        return ['soup', 'fish', 'broth', 'greens', 'egg', 'tomato', 'chicken'].some((s) => text.includes(s));
      }
      if (goal === 'add_weight') {
        return ['beans', 'dodo', 'yam', 'rice', 'jollof', 'pasta', 'stew'].some((s) => text.includes(s));
      }
      return true;
    });
    if (goalMatches.length > 0) {
      finalPool = goalMatches;
    }
  }

  // Natural rotation using day of month and hour seed
  const rotationIndex = (new Date().getDate() * 3 + new Date().getHours()) % finalPool.length;
  return finalPool[rotationIndex];
}

/**
 * Returns a curated multi-meal deck for fluid swipeable carousel navigation.
 */
export function getInitialMealDeck(
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night',
  pass?: UserKitchenPass,
  count: number = 8
): RolledMeal[] {
  const currentPass = pass || preferencesStore.getKitchenPass();
  const pool = getFilteredCatalogMeals(timeOfDay, currentPass, true);
  const unpassed = pool.filter((m) => !sessionPassedTitles.includes(m.title));
  const candidatePool = unpassed.length >= count ? unpassed : pool;

  // Build deck prioritizing first matching meal, then distinct companion dishes
  const primary = getInitialMeal(timeOfDay, currentPass);
  const remaining = candidatePool.filter((m) => m.title !== primary.title);
  return [primary, ...remaining].slice(0, count);
}

// ==========================================
// 1. AFRICAN & CARIBBEAN VIBRANT MEAL CATALOG
// ==========================================
const EVERYDAY_MEALS: Record<'morning' | 'lunch' | 'dinner' | 'late_night', RolledMeal[]> = {
  morning: [
    {
      id: 'm-dodo-egg',
      title: 'Dodo & Fried Egg',
      subtitle: 'Sweet fried ripe plantain with soft peppered eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 10,
      estCost: 1.8,
      pantryNote: 'Uses plantain & eggs from your kitchen',
      mamaTip: 'Slice plantains into thick coins and let them caramelize dark golden before adding the eggs.',
      ingredients: [
        { name: 'Ripe Plantain', amount: '1 medium' },
        { name: 'Eggs', amount: '2 large' },
        { name: 'Vegetable Oil & Salt', amount: '2 tbsp' },
      ],
      steps: [
        'Slice ripe plantain into rounds and shallow-fry until golden.',
        'Beat eggs with a pinch of salt and diced pepper or onion.',
        'Fry eggs gently in the same pan until just set and slide onto plate.',
      ],
    },
    {
      id: 'm-bread-egg',
      title: 'Bread & Fried Egg',
      subtitle: 'Warm toasted crusty bread with loose seasoned eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 8,
      estCost: 1.4,
      pantryNote: 'Uses bread & eggs from your kitchen',
      mamaTip: 'Toast the bread right in the buttery pan edges while the eggs sizzle. Zero extra pans!',
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Eggs', amount: '2' },
        { name: 'Butter / Oil', amount: '1 tbsp' },
      ],
      steps: [
        'Toast bread in a hot skillet with a knob of butter until crisp.',
        'Crack eggs into the pan and fry sunny-side or scrambled.',
        'Serve eggs tucked hot into the crusty bread.',
      ],
    },
    {
      id: 'm-yam-egg-sauce',
      title: 'Yam & Egg Sauce',
      subtitle: 'Tender boiled yam wedges with rich tomato egg sauce.',
      timeOfDay: 'morning',
      cookTimeMinutes: 15,
      estCost: 1.9,
      pantryNote: 'Uses yam & eggs from your pantry',
      mamaTip: 'A fork-tender piece of boiled yam dipped in spicy egg sauce starts your day right.',
      ingredients: [
        { name: 'Puna Yam', amount: '3 slices' },
        { name: 'Eggs', amount: '2' },
        { name: 'Tomato & Onion', amount: '1 each' },
      ],
      steps: [
        'Boil peeled yam slices in salted water for 10 minutes until tender.',
        'Sauté diced onions and tomatoes in 1 tbsp oil for 3 minutes.',
        'Pour whisked eggs into sauce and gently fold until soft curds form.',
      ],
    },
    {
      id: 'm-toast-tea',
      title: 'Toast & Hot Tea',
      subtitle: 'Buttery crisp toast with a sweet comforting cup of tea.',
      timeOfDay: 'morning',
      cookTimeMinutes: 5,
      estCost: 1.0,
      pantryNote: 'Uses pantry staples',
      mamaTip: 'Spread the butter while the toast is piping hot so it melts into every crumb.',
      ingredients: [
        { name: 'Bread', amount: '2-3 slices' },
        { name: 'Tea Bag & Milk', amount: '1 mug' },
        { name: 'Butter', amount: '1 tbsp' },
      ],
      steps: [
        'Boil water and steep black tea with rich evaporated milk.',
        'Toast bread until golden brown and spread butter while steaming.',
        'Dip toast in warm tea and enjoy a calm morning.',
      ],
    },
    {
      id: 'm-oatmeal',
      title: 'Oatmeal & Milk',
      subtitle: 'Quick comforting oats with creamy milk and sliced banana.',
      timeOfDay: 'morning',
      cookTimeMinutes: 6,
      estCost: 1.2,
      pantryNote: 'Uses oats & milk from your pantry',
      mamaTip: 'A tiny pinch of salt in your oats brings out the rich sweetness of the warm milk.',
      ingredients: [
        { name: 'Rolled Oats', amount: '1 cup' },
        { name: 'Milk', amount: '1 cup' },
        { name: 'Honey or Sugar', amount: '1 tsp' },
      ],
      steps: [
        'Simmer oats with water and a pinch of salt for 4 minutes.',
        'Stir in warm creamy milk and a drizzle of honey.',
        'Serve hot in a deep bowl for long-lasting morning energy.',
      ],
    },
    {
      id: 'm-plantain-frittata',
      title: 'Fried Plantain & Scrambled Eggs',
      subtitle: 'Golden caramelized plantain rounds with soft seasoned eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 14,
      estCost: 1.9,
      pantryNote: 'Uses plantain & eggs',
      mamaTip: 'Keep heat low so the eggs stay soft and velvety alongside the sweet plantains.',
      ingredients: [
        { name: 'Ripe Plantain', amount: '1' },
        { name: 'Eggs', amount: '3' },
        { name: 'Sweet Peppers & Onion', amount: '1/2 cup' },
      ],
      steps: [
        'Fry plantain coins in pan until golden on both sides.',
        'Whisk eggs with diced peppers, onions, and seasoning.',
        'Pour eggs into the pan, fold gently on low heat for 3 minutes until soft.',
      ],
    },
    {
      id: 'm-sweet-potato-egg',
      title: 'Sweet Potato & Scrambled Eggs',
      subtitle: 'Pan-seared sweet potato cubes with soft spiced eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 12,
      estCost: 1.5,
      pantryNote: 'Uses sweet potato & eggs',
      mamaTip: 'Dice sweet potatoes small so they tenderize in the skillet without needing to boil first.',
      ingredients: [
        { name: 'Sweet Potato', amount: '1 medium' },
        { name: 'Eggs', amount: '2' },
        { name: 'Cooking Oil', amount: '1 tbsp' },
      ],
      steps: [
        'Dice sweet potato into 1/2-inch cubes and pan-fry in oil until tender.',
        'Push potatoes to side, pour whisked eggs into empty space.',
        'Fold eggs gently and toss everything together hot.',
      ],
    },
    {
      id: 'm-sardine-toast',
      title: 'Sardine & Egg Toast',
      subtitle: 'Toasted bread topped with rich peppered sardines and scrambled eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 8,
      estCost: 1.7,
      pantryNote: 'Uses canned sardine & bread',
      mamaTip: 'Mash sardines with a fork and fry with onions first to take out raw fishiness.',
      ingredients: [
        { name: 'Canned Sardines', amount: '1 tin' },
        { name: 'Eggs', amount: '2' },
        { name: 'Bread', amount: '2 slices' },
      ],
      steps: [
        'Sauté onions and mashed sardines in a pan for 2 minutes.',
        'Crack eggs directly into the sardines and scramble softly.',
        'Mound onto hot toasted bread.',
      ],
    },
  ],
  lunch: [
    {
      id: 'l-jollof-spag',
      title: 'Jollof Spaghetti',
      subtitle: 'Quick spiced pasta simmered in rich tomato stew.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 15,
      estCost: 2.0,
      pantryNote: 'Uses pasta & tomato stew from your pantry',
      mamaTip: 'Snap the pasta straight into the boiling stew; let it drink up all that rich tomato aroma in one pot!',
      ingredients: [
        { name: 'Spaghetti', amount: '150g' },
        { name: 'Tomato Paste / Stew', amount: '2 tbsp' },
        { name: 'Onion & Seasoning Cube', amount: '1' },
      ],
      steps: [
        'Sauté chopped onion and tomato paste in 1 tbsp oil until fragrant.',
        'Add 1.5 cups water, curry, thyme, and seasoning cube; bring to boil.',
        'Snap spaghetti in half, drop in and simmer until sauce is absorbed.',
      ],
    },
    {
      id: 'l-fried-rice',
      title: 'Fried Rice & Chicken',
      subtitle: 'Golden curry rice tossed with diced sweet peppers.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 20,
      estCost: 2.8,
      pantryNote: 'Uses rice & seasoning from your kitchen',
      mamaTip: 'Sizzle the curry and thyme in hot oil first to wake up the aroma before tossing in the rice.',
      ingredients: [
        { name: 'Cooked Rice', amount: '2 cups' },
        { name: 'Curry Powder & Thyme', amount: '1 tsp' },
        { name: 'Mixed Veggies / Pepper', amount: '1/2 cup' },
      ],
      steps: [
        'Sizzle curry and thyme in 2 tbsp hot oil for 30 seconds.',
        'Toss in diced veggies and cooked rice on high heat.',
        'Stir-fry vigorously until rice is fragrant, fluffy, and golden.',
      ],
    },
    {
      id: 'l-corned-beef-spag',
      title: 'Spaghetti & Corned Beef',
      subtitle: 'Saucy spaghetti tossed in savory corned beef stew.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 14,
      estCost: 2.2,
      pantryNote: 'Uses pasta & canned corned beef',
      mamaTip: 'Let the corned beef fry down with onions until it darkens slightly before tossing with the pasta.',
      ingredients: [
        { name: 'Spaghetti', amount: '150g' },
        { name: 'Corned Beef', amount: '1/2 can' },
        { name: 'Tomato & Onions', amount: '1 each' },
      ],
      steps: [
        'Boil spaghetti until tender; drain.',
        'Fry sliced onions and tomatoes with corned beef in a hot pan (4 mins).',
        'Toss spaghetti straight into the rich beef sauce and serve hot.',
      ],
    },
    {
      id: 'l-beans-dodo',
      title: 'Beans & Plantain',
      subtitle: 'Tender honey beans paired with sweet golden dodo.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 18,
      estCost: 2.1,
      pantryNote: 'Uses beans & ripe plantain',
      mamaTip: 'A spoonful of palm oil and pepper sauce makes the beans silky next to sweet fried dodo.',
      ingredients: [
        { name: 'Cooked Beans / Ewa', amount: '1.5 cups' },
        { name: 'Ripe Plantain', amount: '1' },
        { name: 'Palm Oil & Pepper', amount: '2 tbsp' },
      ],
      steps: [
        'Warm beans with palm oil and pepper sauce in a pot.',
        'Slice plantains and fry until deeply golden.',
        'Ladle beans beside the sweet plantains and eat warm.',
      ],
    },
    {
      id: 'l-peppered-fish-rice',
      title: 'Fried Fish & Rice',
      subtitle: 'Crisped fish tossed in sweet pepper sauce over white rice.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 18,
      estCost: 2.5,
      pantryNote: 'Uses fish, rice & peppers',
      mamaTip: 'Pan-fry the fish crisp before tossing in the pepper reduction so it does not turn soggy.',
      ingredients: [
        { name: 'White Rice', amount: '1 cup' },
        { name: 'Fish Fillet / Mackerel', amount: '1 piece' },
        { name: 'Bell Pepper & Onion Sauce', amount: '1/2 cup' },
      ],
      steps: [
        'Steam rice in salted water until fluffy.',
        'Pan-sear seasoned fish in hot oil until skin is crispy (6 mins).',
        'Toss fish in spicy tomato-pepper sauce and serve over rice.',
      ],
    },
    {
      id: 'l-coconut-rice',
      title: 'Coconut Rice',
      subtitle: 'Fragrant rice simmered in sweet coconut milk and peppers.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 20,
      estCost: 2.4,
      pantryNote: 'Uses rice & coconut milk',
      mamaTip: 'Use a tight-fitting lid so the coconut aroma stays trapped in the rice grains.',
      ingredients: [
        { name: 'Rice', amount: '1 cup' },
        { name: 'Coconut Milk', amount: '1/2 can' },
        { name: 'Onions & Seasoning', amount: '1 portion' },
      ],
      steps: [
        'Sauté onions in 1 tbsp oil until fragrant.',
        'Add coconut milk, 1 cup water, and bouillon cube; bring to boil.',
        'Stir in rice, cover with lid on low heat and steam for 15 minutes.',
      ],
    },
    {
      id: 'l-curry-noodles-egg',
      title: 'Curry Noodles & Egg',
      subtitle: 'Quick spiced noodles with fragrant curry and a fried egg.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 8,
      estCost: 1.3,
      pantryNote: 'Uses noodles & egg',
      mamaTip: 'Cook the noodles in 2 minutes so they don\'t turn mushy when tossed with curry.',
      ingredients: [
        { name: 'Instant Noodles', amount: '1 pack' },
        { name: 'Curry Powder & Thyme', amount: '1/2 tsp' },
        { name: 'Egg', amount: '1' },
      ],
      steps: [
        'Boil noodles in 1 cup water with seasoning for 2 minutes.',
        'Fry egg in a hot pan with a splash of oil until edges are crisp.',
        'Slide sunny egg onto saucy noodles and eat hot.',
      ],
    },
    {
      id: 'l-gizdodo-skillet',
      title: 'Gizdodo & Rice',
      subtitle: 'Sweet fried plantain cubes and tender chicken in rich pepper stew.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 18,
      estCost: 2.6,
      pantryNote: 'Uses plantain & gizzard / chicken',
      mamaTip: 'Combine sweet plantains with savory protein in the thick pepper reduction for instant comfort.',
      ingredients: [
        { name: 'Ripe Plantain', amount: '1' },
        { name: 'Chicken Gizzard or Chicken', amount: '150g' },
        { name: 'Tomato & Bell Pepper Sauce', amount: '1/2 cup' },
      ],
      steps: [
        'Dice and fry plantains until golden; set aside.',
        'Sear seasoned chicken or gizzard in pan until browned.',
        'Toss plantains and protein together in simmering pepper sauce for 3 minutes.',
      ],
    },
  ],
  dinner: [
    {
      id: 'd-white-rice-stew',
      title: 'White Rice & Stew',
      subtitle: 'Steamed rice with savory tomato and pepper stew.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 20,
      estCost: 2.2,
      pantryNote: 'Uses rice & pepper stew from your kitchen',
      mamaTip: 'Ladle the hot stew while the rice is steaming so the sauce coats every grain.',
      ingredients: [
        { name: 'Rice', amount: '1 cup' },
        { name: 'Tomato & Pepper Stew', amount: '1 cup' },
        { name: 'Boiled Egg or Fish', amount: '1' },
      ],
      steps: [
        'Steam washed rice with a pinch of salt until tender and fluffy.',
        'Warm pepper stew in a skillet until aromatic.',
        'Ladle rich stew generously over the hot rice.',
      ],
    },
    {
      id: 'd-yam-egg',
      title: 'Yam & Egg Sauce',
      subtitle: 'Soft boiled white yam with sweet pepper and onion egg sauce.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 18,
      estCost: 2.0,
      pantryNote: 'Uses yam & eggs from your kitchen',
      mamaTip: 'Fork-tender yam dipped in soft runny egg and tomato sauce is the ultimate comfort.',
      ingredients: [
        { name: 'Puna Yam', amount: '3-4 slices' },
        { name: 'Eggs', amount: '2' },
        { name: 'Tomato & Onion', amount: '1 diced' },
      ],
      steps: [
        'Peel and boil yam slices in salted water until fork-tender (12 mins).',
        'Sauté onions and diced tomatoes in oil, pour whisked eggs on top.',
        'Fold eggs into loose, saucy curds and serve with steaming yam.',
      ],
    },
    {
      id: 'd-eba-egusi',
      title: 'Eba & Egusi Soup',
      subtitle: 'Warm yellow garri eba with nutty melon seed soup.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 20,
      estCost: 2.6,
      pantryNote: 'Uses garri & egusi from your kitchen',
      mamaTip: 'Pour boiling water steadily over the garri and fold immediately for smooth, lump-free eba.',
      ingredients: [
        { name: 'Garri / Eba', amount: '1 cup' },
        { name: 'Egusi Soup', amount: '1 bowl' },
      ],
      steps: [
        'Sprinkle garri into boiling water and turn firmly into smooth eba.',
        'Warm rich egusi soup with spinach greens in a pan.',
        'Mound eba beside the hot soup and enjoy a proper home dinner.',
      ],
    },
    {
      id: 'd-party-jollof',
      title: 'Jollof Rice & Fried Plantain',
      subtitle: 'Smoky spiced rice with sweet caramelized plantain slices.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 25,
      estCost: 2.5,
      pantryNote: 'Uses rice, tomatoes & plantain',
      mamaTip: 'Cover the rice with foil under the pot lid so trapped steam bakes that authentic smoky party aroma.',
      ingredients: [
        { name: 'Long Grain Rice', amount: '1.5 cups' },
        { name: 'Tomato & Pepper Blend', amount: '1 cup' },
        { name: 'Ripe Plantain', amount: '1' },
      ],
      steps: [
        'Fry tomato paste and pepper sauce in oil until fragrant.',
        'Add rice and broth, cover tightly with foil and steam until smoky.',
        'Fry plantain slices until caramelized and serve alongside.',
      ],
    },
    {
      id: 'd-peppered-chicken-dodo',
      title: 'Chicken & Fried Plantain',
      subtitle: 'Pan-seared spiced chicken tossed with sweet plantains.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 20,
      estCost: 2.8,
      pantryNote: 'Uses chicken & plantains',
      mamaTip: 'Sear chicken skin-side down first to render the fat before tossing with pepper sauce.',
      ingredients: [
        { name: 'Chicken', amount: '200g' },
        { name: 'Plantain', amount: '1' },
        { name: 'Pepper Sauce', amount: '1/2 cup' },
      ],
      steps: [
        'Pan-fry seasoned chicken pieces until golden brown and cooked through.',
        'Fry plantain coins until sweet and caramelized.',
        'Toss chicken and plantains together in warm pepper stew for 2 minutes.',
      ],
    },
    {
      id: 'd-fried-yam-shito',
      title: 'Fried Yam & Pepper Sauce',
      subtitle: 'Golden crusted yam wedges served hot with rich spicy pepper sauce.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 16,
      estCost: 1.8,
      pantryNote: 'Uses yam & pepper sauce',
      mamaTip: 'Salt your yam immediately after it comes out of the hot oil so it absorbs the seasoning.',
      ingredients: [
        { name: 'Yam', amount: '4 thick wedges' },
        { name: 'Shito / Hot Pepper Sauce', amount: '2 tbsp' },
        { name: 'Cooking Oil', amount: 'for frying' },
      ],
      steps: [
        'Cut yam into finger wedges and soak in salted water for 5 minutes.',
        'Deep-fry in hot oil until crisp and light golden on the outside.',
        'Drain on paper towels and serve piping hot with spicy pepper sauce.',
      ],
    },
    {
      id: 'd-jollof-pasta-sausage',
      title: 'Jollof Pasta & Sausage',
      subtitle: 'Spiced spaghetti simmered in tomato sauce with sliced sausage.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 15,
      estCost: 2.2,
      pantryNote: 'Uses pasta & sausage',
      mamaTip: 'Let the sausage brown first in the skillet to leave delicious caramelized drippings for the sauce.',
      ingredients: [
        { name: 'Spaghetti / Penne', amount: '150g' },
        { name: 'Sausage', amount: '2 links' },
        { name: 'Tomato Stew & Onion', amount: '1/2 cup' },
      ],
      steps: [
        'Slice sausage and brown in skillet oil for 3 minutes.',
        'Stir in tomato stew and 1.5 cups water; bring to a simmer.',
        'Drop pasta directly in, cover, and cook for 8 minutes until sauce is absorbed.',
      ],
    },
    {
      id: 'd-steamed-beans-dodo',
      title: 'Beans & Fried Plantain',
      subtitle: 'Comforting stewed beans with sweet plantains and palm oil.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 18,
      estCost: 2.0,
      pantryNote: 'Uses beans & plantain',
      mamaTip: 'Mash a few spoonfuls of beans with your cooking spoon to make the stew thick and hearty.',
      ingredients: [
        { name: 'Cooked Beans', amount: '1.5 cups' },
        { name: 'Ripe Plantain', amount: '1' },
        { name: 'Onions & Palm Oil', amount: '2 tbsp' },
      ],
      steps: [
        'Simmer beans with palm oil, diced onions, and chili until rich.',
        'Shallow-fry plantain slices until dark golden.',
        'Serve beans hot with plantain layered on top.',
      ],
    },
  ],
  late_night: [
    {
      id: 'ln-indomie-egg',
      title: 'Indomie & Boiled Egg',
      subtitle: 'Spicy noodles with a tender boiled egg.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 7,
      estCost: 1.2,
      pantryNote: 'Uses instant noodles & egg from your pantry',
      mamaTip: 'Don\'t boil away all the noodle broth! Keep a few spoonfuls of spicy sauce for the egg yolk to mix into.',
      ingredients: [
        { name: 'Noodles', amount: '1 pack' },
        { name: 'Egg', amount: '1' },
        { name: 'Chili Powder / Veggies', amount: 'optional' },
      ],
      steps: [
        'Boil egg in water for 6-7 minutes, cool and peel.',
        'Cook noodles with seasoning packet in 1.5 cups boiling water for 3 minutes.',
        'Serve steaming noodles with sliced boiled egg on top.',
      ],
    },
    {
      id: 'ln-toast-egg',
      title: 'Toast & Fried Egg',
      subtitle: 'Crisp buttery toast with a soft runny egg.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 6,
      estCost: 1.1,
      pantryNote: 'Uses bread & egg from your kitchen',
      mamaTip: 'Crack the egg right into the sizzling butter; 2 minutes and you are eating in peace.',
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Egg', amount: '1' },
        { name: 'Butter & Pepper', amount: '1 tbsp' },
      ],
      steps: [
        'Melt butter in skillet, place bread to toast on one side.',
        'Crack egg next to the bread, season with salt and pepper.',
        'Slide egg onto the golden toast and eat warm.',
      ],
    },
    {
      id: 'ln-pepper-tea-bread',
      title: 'Bread & Hot Tea',
      subtitle: 'Steaming sweet milky tea with fresh soft bread.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 4,
      estCost: 0.9,
      pantryNote: 'Uses tea, milk & bread',
      mamaTip: 'Warm milk and tea calms your mind so you can switch off properly tonight.',
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Black Tea / Cocoa', amount: '1 mug' },
        { name: 'Evaporated Milk', amount: '2 tbsp' },
      ],
      steps: [
        'Brew hot tea with rich evaporated milk and sugar to taste.',
        'Slather soft bread with salted butter.',
        'Dip bread in warm tea and relax.',
      ],
    },
    {
      id: 'ln-garlic-rice-scramble',
      title: 'Garlic Rice & Egg',
      subtitle: 'Pan-toasted leftover rice with garlic butter and soft egg.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 6,
      estCost: 1.2,
      pantryNote: 'Uses rice & egg',
      mamaTip: 'High heat gives leftover rice crispy bits in under 4 minutes.',
      ingredients: [
        { name: 'Cooked Rice', amount: '1 cup' },
        { name: 'Egg', amount: '1' },
        { name: 'Garlic & Oil', amount: '1 tbsp' },
      ],
      steps: [
        'Sizzle minced garlic in oil for 30 seconds.',
        'Toss in rice and stir vigorously on high heat.',
        'Crack egg directly in, scramble through the rice, and serve hot.',
      ],
    },
  ],
};

// ==========================================
// 2. WEEKNIGHT COMFORT MEAL CATALOG (UK, US, CA, EU, Global)
// ==========================================
const EVERYDAY_MEALS_COMFORT: Record<'morning' | 'lunch' | 'dinner' | 'late_night', RolledMeal[]> = {
  morning: [
    {
      id: 'mc-sourdough-scramble',
      title: 'Toast & Scrambled Eggs',
      subtitle: 'Toasted crusty sourdough with velvety seasoned eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 8,
      estCost: 1.8,
      pantryNote: 'Uses bread & eggs from your kitchen',
      mamaTip: 'Take eggs off the heat while they still look slightly runny; residual heat cooks them to perfection.',
      ingredients: [
        { name: 'Sourdough / Bread', amount: '2 slices' },
        { name: 'Eggs', amount: '2 large' },
        { name: 'Butter', amount: '1 tbsp' },
      ],
      steps: [
        'Toast bread in skillet with butter until crisp and golden.',
        'Whisk eggs with a pinch of salt; pour into low-heat buttery pan.',
        'Gently fold into soft loose curds and pile onto crusty toast.',
      ],
    },
    {
      id: 'mc-avocado-toast',
      title: 'Avocado & Tomato Toast',
      subtitle: 'Crisp sourdough with crushed avocado and ripe tomatoes.',
      timeOfDay: 'morning',
      cookTimeMinutes: 6,
      estCost: 2.2,
      pantryNote: 'Uses bread, avocado & tomatoes',
      mamaTip: 'A squeeze of fresh lemon juice keeps the avocado bright and cuts through the richness.',
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Avocado', amount: '1 ripe' },
        { name: 'Tomatoes & Chili Flakes', amount: 'to taste' },
      ],
      steps: [
        'Toast bread until deeply golden and crunchy.',
        'Mash avocado with salt, pepper, and a pinch of chili flakes.',
        'Spread generously on toast and top with sliced tomatoes.',
      ],
    },
    {
      id: 'mc-honey-porridge',
      title: 'Oatmeal & Honey',
      subtitle: 'Warm oats simmered with milk, honey, and cinnamon.',
      timeOfDay: 'morning',
      cookTimeMinutes: 7,
      estCost: 1.1,
      pantryNote: 'Uses oats & milk from pantry',
      mamaTip: 'Stir constantly with a wooden spoon so the oats release their starch and become silky.',
      ingredients: [
        { name: 'Rolled Oats', amount: '1 cup' },
        { name: 'Milk', amount: '1 cup' },
        { name: 'Honey & Cinnamon', amount: '1 tbsp' },
      ],
      steps: [
        'Simmer oats and milk over medium heat for 4-5 minutes.',
        'Stir in a drizzle of honey and a pinch of cinnamon.',
        'Pour into a warm bowl and top with sliced fruit or nuts.',
      ],
    },
    {
      id: 'mc-french-toast',
      title: 'French Toast',
      subtitle: 'Golden eggy bread cooked in butter with sweet cinnamon.',
      timeOfDay: 'morning',
      cookTimeMinutes: 9,
      estCost: 1.5,
      pantryNote: 'Uses bread, egg & milk',
      mamaTip: 'Don\'t soak the bread too long; a 5-second dip per side keeps the middle fluffy.',
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Egg & Milk', amount: '1 egg, 2 tbsp milk' },
        { name: 'Butter & Cinnamon', amount: '1 tbsp' },
      ],
      steps: [
        'Whisk egg, milk, and cinnamon in a shallow dish.',
        'Dip bread on each side to coat.',
        'Fry in melted butter for 2-3 minutes per side until golden brown.',
      ],
    },
    {
      id: 'mc-breakfast-hash',
      title: 'Fried Potatoes & Eggs',
      subtitle: 'Crispy diced potatoes with sweet peppers and sunny eggs.',
      timeOfDay: 'morning',
      cookTimeMinutes: 14,
      estCost: 1.6,
      pantryNote: 'Uses potatoes & eggs',
      mamaTip: 'Leave potatoes undisturbed in the skillet for the first 4 minutes to build a crispy golden crust.',
      ingredients: [
        { name: 'Potato', amount: '1 medium diced' },
        { name: 'Eggs', amount: '2' },
        { name: 'Onion & Pepper', amount: '1/2 cup' },
      ],
      steps: [
        'Fry diced potatoes in 1 tbsp oil on medium heat until tender and crisp (8 mins).',
        'Add diced onions and peppers; cook for 3 minutes.',
        'Make two wells in the hash, crack in eggs, cover and cook until whites set.',
      ],
    },
  ],
  lunch: [
    {
      id: 'lc-garlic-rice-egg',
      title: 'Garlic Rice & Egg',
      subtitle: 'Fragrant pan-toasted rice with garlic butter and sunny egg.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 10,
      estCost: 1.6,
      pantryNote: 'Uses rice, garlic & egg from your kitchen',
      mamaTip: 'Let the rice toast against the hot skillet in butter until you hear that golden sizzle.',
      ingredients: [
        { name: 'Cooked Rice', amount: '1.5 cups' },
        { name: 'Garlic & Butter', amount: '2 cloves, 1 tbsp' },
        { name: 'Egg', amount: '1' },
      ],
      steps: [
        'Sauté minced garlic in melted butter for 30 seconds until fragrant.',
        'Toss in cooked rice with a dash of soy sauce; stir-fry for 3 minutes.',
        'Fry egg in the same pan with crisp edges and slide on top.',
      ],
    },
    {
      id: 'lc-quesadilla',
      title: 'Cheese Quesadilla',
      subtitle: 'Melted cheddar and scallions toasted inside crisp flatbread.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 8,
      estCost: 1.5,
      pantryNote: 'Uses tortillas & cheese from pantry',
      mamaTip: 'Toast both sides in a dry skillet until the cheese bubbles and the edges turn crispy.',
      ingredients: [
        { name: 'Tortillas', amount: '2' },
        { name: 'Cheddar Cheese', amount: '60g grated' },
        { name: 'Scallions / Onion', amount: '1 finely sliced' },
      ],
      steps: [
        'Place flatbread in dry hot skillet and scatter cheese and scallions inside.',
        'Fold in half and press down gently with your spatula.',
        'Toast each side for 3 minutes until cheese is melted and crust is golden.',
      ],
    },
    {
      id: 'lc-lemon-butter-pasta',
      title: 'Garlic Butter Spaghetti',
      subtitle: 'Silky pasta tossed in sizzling garlic butter, lemon, and black pepper.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 12,
      estCost: 1.8,
      pantryNote: 'Uses pasta, garlic & butter',
      mamaTip: 'Save 2 tablespoons of pasta cooking water to create a glossy emulsion with the butter.',
      ingredients: [
        { name: 'Spaghetti', amount: '150g' },
        { name: 'Garlic & Butter', amount: '2 cloves, 2 tbsp' },
        { name: 'Lemon Juice & Pepper', amount: 'to taste' },
      ],
      steps: [
        'Boil pasta in salted water until al dente; reserve 2 tbsp water.',
        'Melt butter in skillet with minced garlic on medium heat (1 min).',
        'Toss hot pasta and pasta water into garlic butter; finish with lemon juice.',
      ],
    },
    {
      id: 'lc-tuna-rice-bowl',
      title: 'Tuna & Rice',
      subtitle: 'Flaked savory tuna sautéed with sweet corn, onions, and warm rice.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 9,
      estCost: 2.1,
      pantryNote: 'Uses canned tuna & rice',
      mamaTip: 'Add a dash of soy sauce and black pepper to the hot tuna for instant umami depth.',
      ingredients: [
        { name: 'Canned Tuna', amount: '1 tin' },
        { name: 'Cooked Rice', amount: '1.5 cups' },
        { name: 'Sweet Corn / Onions', amount: '1/2 cup' },
      ],
      steps: [
        'Warm 1 tbsp oil in skillet; sauté diced onions for 2 minutes.',
        'Add drained tuna and corn; cook for 2 minutes until hot.',
        'Toss with warm rice and a drizzle of soy sauce; serve steaming.',
      ],
    },
    {
      id: 'lc-grilled-cheese-soup',
      title: 'Toasted Cheese Sandwich',
      subtitle: 'Crisp buttery bread stuffed with warm bubbling melted cheese.',
      timeOfDay: 'lunch',
      cookTimeMinutes: 8,
      estCost: 1.7,
      pantryNote: 'Uses bread & cheese',
      mamaTip: 'Butter the bread on the outside for that unbeatable diner-style golden crust.',
      ingredients: [
        { name: 'Sourdough', amount: '2 thick slices' },
        { name: 'Cheddar Cheese', amount: '60g' },
        { name: 'Butter', amount: '1 tbsp' },
      ],
      steps: [
        'Butter outer sides of bread and place cheese inside.',
        'Toast in skillet on medium heat for 3 minutes per side until crisp and bubbling.',
        'Cut diagonally and eat warm while cheese pulls.',
      ],
    },
  ],
  dinner: [
    {
      id: 'dc-shakshuka',
      title: 'Eggs in Tomato Sauce',
      subtitle: 'Soft eggs cooked gently in sweet tomato and pepper sauce with crusty bread.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 15,
      estCost: 2.2,
      pantryNote: 'Uses eggs, tomatoes & peppers from your kitchen',
      mamaTip: 'Make small wells in the simmering tomato sauce, drop your eggs in, and cover for runny yolks.',
      ingredients: [
        { name: 'Eggs', amount: '2-3' },
        { name: 'Crushed Tomatoes', amount: '1 cup' },
        { name: 'Sweet Pepper & Onion', amount: '1/2 each' },
        { name: 'Crusty Bread', amount: 'for dipping' },
      ],
      steps: [
        'Sauté diced onion and sweet pepper in olive oil until soft (4 mins).',
        'Pour in crushed tomatoes, cumin, and salt; simmer for 5 minutes.',
        'Crack eggs directly into sauce, cover pan, and cook until whites set.',
      ],
    },
    {
      id: 'dc-tomato-rigatoni',
      title: 'Tomato & Garlic Pasta',
      subtitle: 'Saucy pasta tossed in rich simmered tomatoes, garlic, and olive oil.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 16,
      estCost: 2.0,
      pantryNote: 'Uses pasta, tomatoes & garlic',
      mamaTip: 'Cook the pasta right in the simmering sauce so the starch thickens the sauce into velvet.',
      ingredients: [
        { name: 'Rigatoni / Penne', amount: '150g' },
        { name: 'Tomatoes & Garlic', amount: '2 ripe, 2 cloves' },
        { name: 'Olive Oil & Herbs', amount: '1 tbsp' },
      ],
      steps: [
        'Boil pasta in salted water until al dente; reserve 3 tbsp pasta water.',
        'Simmer olive oil, garlic, and diced tomatoes in skillet for 5 minutes.',
        'Toss pasta in sauce with black pepper and cheese until glossy.',
      ],
    },
    {
      id: 'dc-garlic-butter-chicken',
      title: 'Garlic Butter Chicken',
      subtitle: 'Golden pan-seared chicken pieces basted in savory garlic butter.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 16,
      estCost: 2.7,
      pantryNote: 'Uses chicken, garlic & butter',
      mamaTip: 'Baste the hot bubbling butter repeatedly over the chicken for juicy tenderness.',
      ingredients: [
        { name: 'Chicken Breast / Thighs', amount: '200g' },
        { name: 'Garlic & Butter', amount: '3 cloves, 2 tbsp' },
        { name: 'Olive Oil & Thyme', amount: '1 tbsp' },
      ],
      steps: [
        'Season chicken with salt, black pepper, and thyme.',
        'Sear in hot oil for 5 minutes per side until golden brown.',
        'Toss in butter and smashed garlic; spoon bubbling butter over chicken for 2 minutes.',
      ],
    },
    {
      id: 'dc-pan-seared-salmon',
      title: 'Fried Fish & Potatoes',
      subtitle: 'Tender fish fillet with crispy golden sliced potatoes and lemon.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 15,
      estCost: 3.2,
      pantryNote: 'Uses salmon & potatoes',
      mamaTip: 'Press down gently on the fish with your spatula for 30 seconds so it crisps flat without curling.',
      ingredients: [
        { name: 'Salmon Fillet', amount: '1 portion' },
        { name: 'Potatoes', amount: '1 sliced thin' },
        { name: 'Olive Oil & Lemon', amount: '1 tbsp' },
      ],
      steps: [
        'Fry sliced potatoes in oil until golden and tender (7 mins); move to plate.',
        'Sear salmon skin-side down on high heat for 4 minutes until crisp.',
        'Flip and cook for 2 minutes; serve with potatoes and lemon squeeze.',
      ],
    },
    {
      id: 'dc-creamy-mushroom-pasta',
      title: 'Mushroom & Garlic Pasta',
      subtitle: 'Tender pasta tossed with browned savory mushrooms and garlic cream.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 15,
      estCost: 2.3,
      pantryNote: 'Uses pasta & mushrooms',
      mamaTip: 'Brown mushrooms in a dry skillet first before adding butter so they don\'t turn watery.',
      ingredients: [
        { name: 'Fettuccine / Pasta', amount: '150g' },
        { name: 'Mushrooms', amount: '150g sliced' },
        { name: 'Garlic, Cream / Milk', amount: '1/3 cup' },
      ],
      steps: [
        'Cook pasta in boiling salted water until al dente.',
        'Sauté mushrooms and minced garlic in butter until deep brown (5 mins).',
        'Stir in cream, simmer for 2 minutes, then toss pasta into the glossy sauce.',
      ],
    },
    {
      id: 'dc-sausage-pepper-hash',
      title: 'Sausage & Potatoes',
      subtitle: 'Browned savory sausage coins tossed with sweet bell peppers and potatoes.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 16,
      estCost: 2.2,
      pantryNote: 'Uses sausage & potatoes',
      mamaTip: 'Let the sausage brown well so the pan gets coated in sweet smoky savory drippings.',
      ingredients: [
        { name: 'Sausage', amount: '2 links sliced' },
        { name: 'Potatoes', amount: '1 diced' },
        { name: 'Bell Pepper & Onion', amount: '1/2 each' },
      ],
      steps: [
        'Brown sliced sausage in skillet for 4 minutes; remove.',
        'Fry diced potatoes and peppers in the drippings until fork-tender (8 mins).',
        'Return sausage to pan, toss together on high heat, and serve hot.',
      ],
    },
    {
      id: 'dc-garlic-butter-shrimp',
      title: 'Shrimp & Garlic Rice',
      subtitle: 'Juicy seared shrimp in lemon garlic butter over warm rice.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 12,
      estCost: 2.8,
      pantryNote: 'Uses shrimp & rice',
      mamaTip: 'Shrimp cook in just 3 minutes! Don\'t overcook them or they become rubbery.',
      ingredients: [
        { name: 'Shrimp / Prawns', amount: '150g peeled' },
        { name: 'Cooked Rice', amount: '1.5 cups' },
        { name: 'Garlic, Butter & Lemon', amount: '2 tbsp' },
      ],
      steps: [
        'Melt butter in skillet; add minced garlic and chili flakes.',
        'Sear shrimp for 2 minutes per side until pink and curled.',
        'Finish with a squeeze of lemon and spoon sauce over warm rice.',
      ],
    },
    {
      id: 'dc-beef-broccoli-stirfry',
      title: 'Beef & Onion Stir-Fry',
      subtitle: 'Thinly sliced tender beef quickly seared with sweet onions and soy sauce.',
      timeOfDay: 'dinner',
      cookTimeMinutes: 12,
      estCost: 2.6,
      pantryNote: 'Uses beef & rice',
      mamaTip: 'Get your skillet smoking hot before adding beef strips so they sear instantly without stewing.',
      ingredients: [
        { name: 'Beef / Steak', amount: '150g sliced thin' },
        { name: 'Onion & Veggies', amount: '1/2 cup' },
        { name: 'Soy Sauce & Garlic', amount: '1 tbsp' },
      ],
      steps: [
        'Sear beef strips in 1 tbsp hot oil for 2-3 minutes on high heat.',
        'Toss in sliced onions and garlic; stir-fry for 2 minutes.',
        'Drizzle with soy sauce and serve hot over rice or toast.',
      ],
    },
  ],
  late_night: [
    {
      id: 'lnc-cheddar-melt',
      title: 'Toasted Cheese Sandwich',
      subtitle: 'Golden toasted bread with warm bubbling melted cheddar.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 5,
      estCost: 1.1,
      pantryNote: 'Uses bread & cheese from kitchen',
      mamaTip: 'Toast on medium heat so the bread gets golden and the cheese has time to fully melt.',
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Sharp Cheddar', amount: '50g' },
        { name: 'Butter', amount: '1 tsp' },
      ],
      steps: [
        'Butter outer sides of bread and place cheese inside.',
        'Toast in skillet on medium heat for 2-3 minutes per side until golden.',
        'Slice in half while bubbling hot and enjoy.',
      ],
    },
    {
      id: 'lnc-garlic-rice',
      title: 'Garlic Butter Rice',
      subtitle: 'Pan-toasted rice with soy sauce, butter, and sweet onions.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 6,
      estCost: 1.0,
      pantryNote: 'Uses rice & pantry seasonings',
      mamaTip: 'A drizzle of soy sauce on hot garlic rice hits the spot like nothing else at midnight.',
      ingredients: [
        { name: 'Cooked Rice', amount: '1 cup' },
        { name: 'Butter & Garlic', amount: '1 tbsp, 1 clove' },
        { name: 'Soy Sauce', amount: '1 tsp' },
      ],
      steps: [
        'Sizzle minced garlic in butter for 30 seconds.',
        'Add rice and soy sauce; toss on high heat until fragrant.',
        'Serve in a hot bowl for comforting late night energy.',
      ],
    },
    {
      id: 'lnc-butter-noodles',
      title: 'Butter & Garlic Noodles',
      subtitle: 'Warm comforting noodles tossed in garlic butter with black pepper.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 5,
      estCost: 1.2,
      pantryNote: 'Uses noodles & butter',
      mamaTip: 'A pinch of black pepper and butter on hot noodles is the fastest midnight comfort in the world.',
      ingredients: [
        { name: 'Ramen or Pasta', amount: '1 portion' },
        { name: 'Butter', amount: '1 tbsp' },
        { name: 'Garlic Powder & Salt', amount: 'to taste' },
      ],
      steps: [
        'Boil noodles for 3 minutes; drain.',
        'Melt butter in pan with garlic powder and black pepper.',
        'Toss noodles in melted butter until glossy and eat hot.',
      ],
    },
    {
      id: 'lnc-egg-sriracha-toast',
      title: 'Egg & Chili Toast',
      subtitle: 'Crisp buttery toast topped with a runny fried egg and chili drizzle.',
      timeOfDay: 'late_night',
      cookTimeMinutes: 5,
      estCost: 1.1,
      pantryNote: 'Uses bread & egg',
      mamaTip: 'Cook the egg in the same pan right after the toast for zero cleanup.',
      ingredients: [
        { name: 'Bread', amount: '1 slice' },
        { name: 'Egg', amount: '1' },
        { name: 'Butter & Hot Sauce', amount: '1 tsp' },
      ],
      steps: [
        'Toast bread in skillet with butter until crisp.',
        'Fry egg in the pan for 2 minutes until whites are set and yolk is runny.',
        'Slide egg onto toast and finish with hot sauce.',
      ],
    },
  ],
};

export const rollService = {
  sessionPassedTitles,

  getSessionPassedTitles(): string[] {
    return sessionPassedTitles;
  },

  addSessionPass(title: string) {
    if (!sessionPassedTitles.includes(title)) {
      sessionPassedTitles.push(title);
    }
  },

  removeSessionPass(title: string) {
    const idx = sessionPassedTitles.indexOf(title);
    if (idx !== -1) {
      sessionPassedTitles.splice(idx, 1);
    }
  },

  resetSessionPasses() {
    sessionPassedTitles.length = 0;
  },

  /** Clear prefetched & cached AI meals when the user switches country/Mama */
  resetForRegionChange() {
    prefetchedMeal = null;
    prefetchInFlight = null;
    sessionPassedTitles.length = 0;
    aiMealCache.clear().catch(() => {});
  },

  /** Return previously generated live AI meals cached on-device for THIS exact country & cuisine */
  async getCachedAiDeck(
    timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night',
    pass?: UserKitchenPass
  ): Promise<RolledMeal[]> {
    const currentPass = pass || preferencesStore.getKitchenPass();
    const neverShowLower = toLowerList(currentPass.neverShowDishes || []);
    const matched = await aiMealCache.getMatching(
      (m) =>
        m.country === currentPass.country &&
        m.cuisineAnchor === currentPass.cuisineAnchor &&
        !neverShowLower.includes(m.title.toLowerCase()) &&
        isMealDietCompliant(m, currentPass)
    );
    const samePeriod = matched.filter((m) => m.timeOfDay === timeOfDay);
    return samePeriod.length > 0 ? samePeriod : matched;
  },

  /**
   * Generate a fresh 5-card live AI Home deck tailored specifically to the active country,
   * time of day, and user's kitchen pantry. Zero hardcoded mock dishes.
   */
  async generateLiveDailyDeck(
    overrideTimeOfDay?: 'morning' | 'lunch' | 'dinner' | 'late_night',
    pass?: UserKitchenPass,
    overridePantry?: string[]
  ): Promise<RolledMeal[]> {
    const timeOfDay = overrideTimeOfDay || getCurrentTimeOfDay();
    const currentPass = pass || preferencesStore.getKitchenPass();
    let pantryNames = overridePantry;
    if (!pantryNames) {
      try {
        const items = await pantryService.fetchAll();
        pantryNames = items.map((i) => i.name);
      } catch {
        pantryNames = pantryService.getCachedPantry().map((i) => i.name);
      }
    }

    const rawMeals = await AiMamaService.generateDailyDeckWithAI(
      timeOfDay,
      currentPass,
      pantryNames,
      sessionPassedTitles
    );

    const seen = new Set<string>();
    const neverShowLower = toLowerList(currentPass.neverShowDishes || []);
    const normalized: RolledMeal[] = [];

    for (const raw of rawMeals) {
      const meal = normaliseAiMeal(raw, timeOfDay, currentPass);
      if (!meal) continue;
      const key = meal.title.toLowerCase();
      if (seen.has(key) || neverShowLower.includes(key)) continue;
      seen.add(key);
      normalized.push(meal);
    }

    if (normalized.length > 0) {
      // Persist to on-device AI cache stamped with this country & cuisine
      for (let i = normalized.length - 1; i >= 0; i--) {
        aiMealCache.add(normalized[i]).catch(() => {});
      }
      return normalized;
    }

    // Only reuse previously generated live AI meals for THIS exact country if offline
    return this.getCachedAiDeck(timeOfDay, currentPass);
  },

  async rollNextMeal(
    overrideTimeOfDay?: 'morning' | 'lunch' | 'dinner' | 'late_night',
    currentDishTitle?: string
  ): Promise<RolledMeal> {
    const timeOfDay = overrideTimeOfDay || getCurrentTimeOfDay();
    const kitchenPass: UserKitchenPass = preferencesStore.getKitchenPass();

    // 1. Fetch pantry items
    let pantryNames: string[] = [];
    try {
      const items = await pantryService.fetchAll();
      pantryNames = items.map((i) => i.name);
    } catch {
      pantryNames = [];
    }

    // 2. Track session passed titles (without blocking on network round-trip)
    const passedTitles: string[] = [...this.sessionPassedTitles];
    if (currentDishTitle && !passedTitles.includes(currentDishTitle)) {
      passedTitles.push(currentDishTitle);
    }

    const recentCookedTitles: string[] = [];

    const passedLower = toLowerList(passedTitles);
    const neverShowLower = toLowerList(kitchenPass.neverShowDishes || []);
    const isUsableMeal = (m: RolledMeal) =>
      !passedLower.includes(m.title.toLowerCase()) &&
      !neverShowLower.includes(m.title.toLowerCase()) &&
      isMealDietCompliant(m, kitchenPass);

    // 2.5. Live AI Roll (with instant prefetch + in-flight join + persistent on-device cache)
    // One shared deadline so joining a prefetch + a direct retry can never exceed the budget.
    const aiDeadline = Date.now() + AI_DIRECT_TIMEOUT_MS;
    const remainingMs = () => Math.max(0, aiDeadline - Date.now());
    const prefsKey = buildPrefsKey(timeOfDay, kitchenPass, pantryNames);
    if (prefetchedMeal && prefetchedMeal.key === prefsKey && isUsableMeal(prefetchedMeal.meal)) {
      const readyMeal = prefetchedMeal.meal;
      prefetchedMeal = null;
      startPrefetch(timeOfDay, kitchenPass, pantryNames, [...passedTitles, readyMeal.title], recentCookedTitles);
      return { ...readyMeal, id: `${readyMeal.id}-${Date.now()}` };
    }

    if (prefetchInFlight && prefetchInFlight.key === prefsKey) {
      const inFlightMeal = await withTimeout(prefetchInFlight.promise, remainingMs());
      if (inFlightMeal && isUsableMeal(inFlightMeal)) {
        prefetchedMeal = null;
        startPrefetch(timeOfDay, kitchenPass, pantryNames, [...passedTitles, inFlightMeal.title], recentCookedTitles);
        return { ...inFlightMeal, id: `${inFlightMeal.id}-${Date.now()}` };
      }
    }

    const liveAiMeal =
      remainingMs() > 1500
        ? await withTimeout(
            requestAiMeal(timeOfDay, kitchenPass, pantryNames, passedTitles, recentCookedTitles, remainingMs()),
            remainingMs()
          )
        : null;
    if (liveAiMeal && isUsableMeal(liveAiMeal)) {
      aiMealCache.add(liveAiMeal).catch(() => {});
      startPrefetch(timeOfDay, kitchenPass, pantryNames, [...passedTitles, liveAiMeal.title], recentCookedTitles);
      return liveAiMeal;
    }

    // Start background prefetch for the next roll while we return a cached AI meal or catalog meal immediately
    startPrefetch(timeOfDay, kitchenPass, pantryNames, passedTitles, recentCookedTitles);

    const cachedAiMeal = await aiMealCache.pick(
      timeOfDay,
      (m) =>
        isUsableMeal(m) &&
        m.country === kitchenPass.country &&
        m.cuisineAnchor === kitchenPass.cuisineAnchor
    );
    if (cachedAiMeal) {
      return { ...cachedAiMeal, id: `${cachedAiMeal.id}-${Date.now()}` };
    }

    // 3. Preference-matched, diet-filtered, time-aware catalog selection
    const candidateMeals = getFilteredCatalogMeals(timeOfDay, kitchenPass, true);

    // Exclude dishes that have already been passed or seen
    let unpassed = candidateMeals.filter((m) => !passedTitles.includes(m.title));
    if (unpassed.length === 0) {
      // If user passed all candidate meals, cycle back while strictly avoiding the last 6 passed dishes
      const recentAvoid = passedTitles.slice(-6);
      unpassed = candidateMeals.filter((m) => !recentAvoid.includes(m.title));
      if (unpassed.length === 0) {
        unpassed = candidateMeals;
      }
    }

    // Build a weighted pool where pantry matches and body goals receive gentle boosts, but NEVER eliminate other meals!
    const weightedPool: RolledMeal[] = [];
    const goal = kitchenPass.bodyGoal;

    unpassed.forEach((meal) => {
      const mealText = `${meal.title} ${meal.subtitle} ${meal.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();
      // Plural/multi-word safe: "Eggs" matches "Egg", "Ripe Plantains" matches "Plantain"
      const matchCount = pantryNames.filter((p) => textMentionsPantryItem(mealText, p)).length;

      // Goal alignment tickets
      let goalTickets = 0;
      if (goal === 'curves_glutes') {
        const curveStaples = ['egg', 'beans', 'plantain', 'dodo', 'yam', 'chicken', 'tuna', 'oats', 'beef', 'peanut', 'fish'];
        if (curveStaples.some((s) => mealText.includes(s))) goalTickets += 2;
      } else if (goal === 'reduce_weight') {
        const leanStaples = ['soup', 'fish', 'broth', 'greens', 'spinach', 'egg', 'tomato', 'chicken breast', 'pepper'];
        if (leanStaples.some((s) => mealText.includes(s))) goalTickets += 2;
      } else if (goal === 'add_weight') {
        const bulkStaples = ['beans', 'dodo', 'yam', 'rice', 'jollof', 'pasta', 'stew', 'peanut', 'curry'];
        if (bulkStaples.some((s) => mealText.includes(s))) goalTickets += 2;
      }

      // 1 base ticket, +3 per pantry match (so "cook with what you have" clearly wins), +2 goal alignment
      const tickets = 1 + matchCount * 3 + goalTickets;
      for (let t = 0; t < tickets; t++) {
        weightedPool.push(meal);
      }
    });

    const selected =
      weightedPool[Math.floor(Math.random() * weightedPool.length)] ||
      unpassed[Math.floor(Math.random() * unpassed.length)] ||
      candidateMeals[0];

    if (__DEV__) {
      console.warn(`[Mama AI] AI unreachable — fell back to catalog meal "${selected.title}"`);
    }

    return {
      ...selected,
      id: `${selected.id}-${Date.now()}`,
      source: 'catalog',
    };
  },
};
