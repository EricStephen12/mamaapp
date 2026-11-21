
/**
 * AI Mama Live Intelligence Service
 * Powered directly by Groq ultra-low-latency LLM inference.
 * Generates culturally tailored real-time dialogue and custom pantry recipes.
 */

import { UserKitchenPass, convertMealCost } from './preferencesStore';
import { MamaDialogueService, MamaSyncContext } from './mamaDialogueService';
import { apiClient } from './api/client';

const cachedAiRolledMeals: any[] = [];

async function callGroqChat(
  messages: { role: string; content: string }[],
  options: {
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    /** 'quality' = recipes. 'fast' = short dialogue lines. */
    tier?: 'quality' | 'fast';
  } = {}
): Promise<any> {
  const {
    jsonMode = false,
    temperature = 0.65,
    maxTokens = 380,
    timeoutMs = 7000,
  } = options;

  // All AI completions run through the secure backend server so zero API keys exist in the APK
  return await apiClient<any>('/api/ai/chat', {
    method: 'POST',
    skipAuth: true,
    timeoutMs,
    body: JSON.stringify({
      messages,
      jsonMode,
      temperature,
      maxTokens,
    }),
  });
}

export interface AIRecipeResult {
  title: string;
  subtitle: string;
  cookTime: string;
  gear: string;
  estCost: string;
  steps: string[];
  ingredients: { name: string; amount: string }[];
  chefTip: string;
}

export interface AIDiscoveryMeal {
  id: string;
  categoryType: 'home';
  cookTimeOrDistance: string;
  title: string;
  nutrition: string;
  reason: string;
  imageUrl: string;
  baseCostUsd: number;
  cuisineTags: string[];
  steps: string[];
  ingredients: { name: string; amount: string }[];
}

const BANNED_TITLE_WORDS =
  /\b(skillet|sizzle|sizzling|crispy|golden|savory|velvety|crusty|artisan|loaded|1-pan|one-pan|pan-seared|soft-scrambled|reduction|medallions|deconstructed|frittata|hash)\b/gi;

export function sanitizeDishTitle(rawTitle: string): string {
  if (!rawTitle) return 'Home Meal';
  const cleaned = rawTitle
    .replace(BANNED_TITLE_WORDS, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,&-]+|[\s,&-]+$/g, '')
    .trim();
  return cleaned.length >= 3 ? cleaned : rawTitle.trim();
}

const REGIONAL_FALLBACK_MEALS: Record<string, AIDiscoveryMeal[]> = {
  african_caribbean: [
    {
      id: 'fb-indomie-egg',
      categoryType: 'home',
      cookTimeOrDistance: '8 MIN',
      title: 'Indomie & Fried Egg',
      nutrition: 'High Energy Comfort',
      reason: 'Quick peppered noodles with a fried egg and sliced onions.',
      imageUrl: '',
      baseCostUsd: 1.5,
      cuisineTags: ['quick', 'african_caribbean'],
      steps: [
        'Boil 1.5 cups water with seasoning packet and a pinch of dry chili.',
        'Add noodles and simmer for 3 minutes until tender and saucy.',
        'Fry egg in hot oil until edges crisp, place on steaming noodles.',
      ],
      ingredients: [
        { name: 'Instant Noodles', amount: '1 pack' },
        { name: 'Egg', amount: '1-2 large' },
        { name: 'Sliced Onions & Pepper', amount: 'To taste' },
      ],
    },
    {
      id: 'fb-dodo-egg',
      categoryType: 'home',
      cookTimeOrDistance: '12 MIN',
      title: 'Dodo & Fried Egg',
      nutrition: 'Sweet & Savory Balance',
      reason: 'Sweet fried plantain slices paired with seasoned eggs.',
      imageUrl: '',
      baseCostUsd: 2.0,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Dice ripe plantains into cubes and shallow fry in oil until golden.',
        'Whisk eggs with diced tomatoes, onions, and salt.',
        'Pour into hot pan and fold softly with plantains; eat warm.',
      ],
      ingredients: [
        { name: 'Ripe Plantain', amount: '1 medium' },
        { name: 'Eggs', amount: '2' },
        { name: 'Tomato & Onion', amount: '1 small' },
      ],
    },
    {
      id: 'fb-jollof-spag',
      categoryType: 'home',
      cookTimeOrDistance: '15 MIN',
      title: 'Jollof Spaghetti',
      nutrition: 'Rich Tomato Stew',
      reason: 'Spiced pasta simmered in rich tomato stew and aromatics.',
      imageUrl: '',
      baseCostUsd: 2.2,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Sauté chopped onions and tomato paste in cooking oil until fragrant.',
        'Add water, curry powder, thyme, and a bouillon cube; bring to boil.',
        'Snap spaghetti in half, simmer in stew until sauce coats the pasta.',
      ],
      ingredients: [
        { name: 'Spaghetti', amount: '150g' },
        { name: 'Tomato Paste / Stew', amount: '2 tbsp' },
        { name: 'Curry & Thyme', amount: '1 tsp' },
      ],
    },
    {
      id: 'fb-yam-egg',
      categoryType: 'home',
      cookTimeOrDistance: '16 MIN',
      title: 'Yam & Egg Sauce',
      nutrition: 'Hearty Traditional Comfort',
      reason: 'Soft boiled yam slices paired with pepper and tomato egg sauce.',
      imageUrl: '',
      baseCostUsd: 2.4,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Peel and boil yam slices in salted water until fork-tender (12 mins).',
        'Sauté onions and diced tomatoes in oil, pour whisked eggs on top.',
        'Fold eggs gently and serve hot with boiled yam.',
      ],
      ingredients: [
        { name: 'Puna Yam', amount: '3-4 slices' },
        { name: 'Eggs', amount: '2' },
        { name: 'Tomato & Onion', amount: '1 diced' },
      ],
    },
    {
      id: 'fb-rice-stew',
      categoryType: 'home',
      cookTimeOrDistance: '18 MIN',
      title: 'White Rice & Stew',
      nutrition: 'Classic Home Comfort',
      reason: 'Fluffy white rice served with rich tomato and pepper stew.',
      imageUrl: '',
      baseCostUsd: 2.1,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Steam washed rice with a pinch of salt until tender and fluffy.',
        'Warm pepper stew in a pan until aromatic.',
        'Ladle stew generously over the hot rice.',
      ],
      ingredients: [
        { name: 'White Rice', amount: '1 cup' },
        { name: 'Tomato & Pepper Stew', amount: '1 cup' },
        { name: 'Boiled Egg or Fish', amount: '1' },
      ],
    },
    {
      id: 'fb-ewa-dodo',
      categoryType: 'home',
      cookTimeOrDistance: '14 MIN',
      title: 'Beans & Fried Plantain',
      nutrition: 'High Fiber & Protein',
      reason: 'Warm stewed beans paired with sweet fried plantain.',
      imageUrl: '',
      baseCostUsd: 1.9,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Warm cooked beans with palm oil and pepper sauce in a pan.',
        'Fry plantain slices until golden brown.',
        'Plate sweet plantain alongside warm beans.',
      ],
      ingredients: [
        { name: 'Cooked Beans', amount: '1.5 cups' },
        { name: 'Ripe Plantain', amount: '1' },
        { name: 'Pepper Sauce', amount: '2 tbsp' },
      ],
    },
    {
      id: 'fb-pepper-soup-yam',
      categoryType: 'home',
      cookTimeOrDistance: '18 MIN',
      title: 'Yam Pepper Soup',
      nutrition: 'Warming Herbal Broth',
      reason: 'Tender yam cubes simmered in aromatic pepper soup broth.',
      imageUrl: '',
      baseCostUsd: 2.1,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Simmer water with pepper soup spices, diced onions, and chili.',
        'Add cubed yam and simmer for 14 minutes until tender.',
        'Serve hot with broth.',
      ],
      ingredients: [
        { name: 'Puna Yam', amount: '3 slices' },
        { name: 'Pepper Soup Spice', amount: '1 tbsp' },
        { name: 'Onion & Herbs', amount: 'To taste' },
      ],
    },
    {
      id: 'fb-chicken-suya-skillet',
      categoryType: 'home',
      cookTimeOrDistance: '14 MIN',
      title: 'Chicken Suya & Onions',
      nutrition: 'High Protein',
      reason: 'Tender seared chicken coated in suya spice with sliced onions.',
      imageUrl: '',
      baseCostUsd: 2.7,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Thinly slice chicken and toss in suya spice with vegetable oil.',
        'Sear in a hot pan undisturbed for 4 minutes until browned.',
        'Toss with sliced red onions and serve hot.',
      ],
      ingredients: [
        { name: 'Chicken Breast / Thighs', amount: '250g' },
        { name: 'Suya Spice / Yaji', amount: '1.5 tbsp' },
        { name: 'Red Onion', amount: '1 large' },
      ],
    },
    {
      id: 'fb-asaro-yam-porridge',
      categoryType: 'home',
      cookTimeOrDistance: '20 MIN',
      title: 'Yam Porridge (Asaro)',
      nutrition: 'Comforting Pottage',
      reason: 'Yam slow-simmered in peppered palm oil and onions.',
      imageUrl: '',
      baseCostUsd: 2.2,
      cuisineTags: ['african_caribbean'],
      steps: [
        'Peel and cube yam into medium chunks in a pot.',
        'Add pepper base, palm oil, salt, and 1.5 cups water; cover and boil.',
        'Mash a few yam chunks to thicken the porridge and serve warm.',
      ],
      ingredients: [
        { name: 'Puna Yam', amount: '4 chunks' },
        { name: 'Palm Oil', amount: '2 tbsp' },
        { name: 'Pepper & Onion Blend', amount: '3 tbsp' },
      ],
    },
  ],
  weeknight_comfort: [
    {
      id: 'fb-sourdough-eggs',
      categoryType: 'home',
      cookTimeOrDistance: '8 MIN',
      title: 'Toast & Scrambled Eggs',
      nutrition: 'Fast Everyday Comfort',
      reason: 'Toasted bread with buttery scrambled eggs and black pepper.',
      imageUrl: '',
      baseCostUsd: 1.8,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Toast bread slices in a pan with butter until crisp.',
        'Whisk eggs with a splash of milk; fold on low heat until soft.',
        'Spoon eggs onto hot toast with salt and pepper.',
      ],
      ingredients: [
        { name: 'Bread', amount: '2 slices' },
        { name: 'Eggs', amount: '2' },
        { name: 'Butter', amount: '1 tbsp' },
      ],
    },
    {
      id: 'fb-garlic-rice-bowl',
      categoryType: 'home',
      cookTimeOrDistance: '12 MIN',
      title: 'Garlic Rice & Egg',
      nutrition: 'Quick Comfort',
      reason: 'Pan-toasted rice tossed with garlic butter and a fried egg.',
      imageUrl: '',
      baseCostUsd: 1.6,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Melt butter in a pan, fry minced garlic until fragrant.',
        'Toss in cooked rice and soy sauce; stir continuously for 3 minutes.',
        'Top with a fried egg.',
      ],
      ingredients: [
        { name: 'Cooked Rice', amount: '1.5 cups' },
        { name: 'Garlic & Butter', amount: '2 cloves, 1 tbsp' },
        { name: 'Egg', amount: '1' },
      ],
    },
    {
      id: 'fb-penne-tomato',
      categoryType: 'home',
      cookTimeOrDistance: '14 MIN',
      title: 'Tomato & Garlic Pasta',
      nutrition: 'Everyday Comfort',
      reason: 'Pasta tossed in simmered tomatoes, garlic, and olive oil.',
      imageUrl: '',
      baseCostUsd: 2.0,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Boil pasta in salted water until tender.',
        'Simmer olive oil, garlic, and diced tomatoes for 5 minutes.',
        'Toss pasta in sauce with cheese and black pepper.',
      ],
      ingredients: [
        { name: 'Pasta', amount: '150g' },
        { name: 'Tomatoes & Garlic', amount: '2 ripe, 2 cloves' },
        { name: 'Olive Oil & Herbs', amount: '1 tbsp' },
      ],
    },
    {
      id: 'fb-cheddar-quesadilla',
      categoryType: 'home',
      cookTimeOrDistance: '9 MIN',
      title: 'Cheese Quesadilla',
      nutrition: 'Fast Fix',
      reason: 'Toasted tortilla packed with melted cheddar and onions.',
      imageUrl: '',
      baseCostUsd: 1.7,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Place flatbread in a dry hot pan.',
        'Scatter grated cheddar and sliced onions inside; fold in half.',
        'Toast both sides until cheese melts and tortilla is crisp.',
      ],
      ingredients: [
        { name: 'Tortilla or Flatbread', amount: '1-2' },
        { name: 'Cheddar Cheese', amount: '60g' },
        { name: 'Onion', amount: '1/2 sliced' },
      ],
    },
    {
      id: 'fb-sausage-hash',
      categoryType: 'home',
      cookTimeOrDistance: '15 MIN',
      title: 'Sausage & Potatoes',
      nutrition: 'Hearty Fuel',
      reason: 'Pan-fried potatoes and sliced sausage with onions.',
      imageUrl: '',
      baseCostUsd: 2.3,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Dice potatoes and slice sausages thinly.',
        'Fry in oil on medium-high until potatoes are tender and browned.',
        'Season with paprika and salt; serve hot.',
      ],
      ingredients: [
        { name: 'Sausage', amount: '2' },
        { name: 'Potato', amount: '1 medium' },
        { name: 'Cooking Oil', amount: '1 tbsp' },
      ],
    },
    {
      id: 'fb-shakshuka-skillet',
      categoryType: 'home',
      cookTimeOrDistance: '15 MIN',
      title: 'Eggs in Tomato Sauce',
      nutrition: 'High Protein',
      reason: 'Eggs gently poached in warm tomato sauce with bread.',
      imageUrl: '',
      baseCostUsd: 2.1,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Simmer diced tomatoes, onions, and garlic in oil for 6 minutes.',
        'Make gentle wells in the sauce and crack fresh eggs inside.',
        'Cover pan on low heat until egg whites are set.',
      ],
      ingredients: [
        { name: 'Eggs', amount: '2-3' },
        { name: 'Tomatoes', amount: '1 can' },
        { name: 'Bread or Toast', amount: '2 slices' },
      ],
    },
    {
      id: 'fb-golden-chicken-skillet',
      categoryType: 'home',
      cookTimeOrDistance: '16 MIN',
      title: 'Garlic Butter Chicken',
      nutrition: 'High Protein Dinner',
      reason: 'Tender pan-seared chicken with garlic and butter.',
      imageUrl: '',
      baseCostUsd: 2.8,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Cut chicken into bite-sized pieces and season with salt and pepper.',
        'Sear in a hot pan with butter and garlic slices for 6 to 8 minutes.',
        'Serve hot straight from the pan.',
      ],
      ingredients: [
        { name: 'Chicken Breast / Thighs', amount: '250g' },
        { name: 'Garlic & Butter', amount: '3 cloves, 1 tbsp' },
        { name: 'Black Pepper & Salt', amount: 'To taste' },
      ],
    },
    {
      id: 'fb-tuna-melt-skillet',
      categoryType: 'home',
      cookTimeOrDistance: '8 MIN',
      title: 'Tuna Melt Sandwich',
      nutrition: 'Quick Comfort',
      reason: 'Flaked tuna with sweet corn and melted cheese on toasted bread.',
      imageUrl: '',
      baseCostUsd: 1.9,
      cuisineTags: ['weeknight_comfort'],
      steps: [
        'Flake canned tuna and mix with sweet corn and a spoon of mayo.',
        'Layer between bread slices with cheddar cheese.',
        'Toast in a pan with butter until bread is browned and cheese melts.',
      ],
      ingredients: [
        { name: 'Canned Tuna', amount: '1 tin' },
        { name: 'Sweet Corn', amount: '2 tbsp' },
        { name: 'Bread & Cheese', amount: '2 slices, 50g' },
      ],
    },
  ],
};

export function buildIntelligentPantryRecipe(pantryItems: string[], pass: UserKitchenPass): AIRecipeResult {
  const currencyCode = pass.currencyCode || 'USD';
  const currencySymbol = pass.currencySymbol || '$';
  const isVegan = pass.dietaryRestrictions?.some((d) => d.toLowerCase() === 'vegan');
  const isVegetarian = isVegan || pass.dietaryRestrictions?.some((d) => d.toLowerCase() === 'vegetarian');

  if (!pantryItems || pantryItems.length === 0) {
    if (isVegan) {
      return {
        title: 'Beans & Fried Plantain',
        subtitle: 'Market run · 3 simple staples to pick up',
        cookTime: '14 min',
        gear: pass.cookingGearLabel || '1 Pan',
        estCost: convertMealCost(1.9, currencyCode, currencySymbol),
        steps: [
          'Pick up 1 ripe plantain, 1 can or cup of cooked beans, and 1 small onion.',
          'Slice plantain into coins and shallow-fry in 1 tbsp oil until golden brown (5 mins).',
          'Warm the beans with sautéed onions, pepper, and salt in the same pan (6 mins) and serve together.',
        ],
        ingredients: [
          { name: 'Ripe Plantain', amount: '1 medium' },
          { name: 'Cooked Beans', amount: '1.5 cups' },
          { name: 'Onion & Pepper', amount: '1 small' },
        ],
        chefTip: 'Even when the kitchen is empty, 3 humble market staples make a royal dinner, my child.',
      };
    }
    return {
      title: pass.cuisineAnchor === 'weeknight_comfort' ? 'Garlic Butter Pasta & Eggs' : 'Dodo & Peppered Eggs',
      subtitle: 'Market run · 3 simple staples to pick up',
      cookTime: '10 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(1.8, currencyCode, currencySymbol),
      steps:
        pass.cuisineAnchor === 'weeknight_comfort'
          ? [
              'Pick up pasta, eggs, and garlic on your way home.',
              'Boil pasta in salted water for 8 minutes; reserve 2 tbsp water and drain.',
              'Toss pasta in pan with butter/oil, garlic, and 2 soft-scrambled eggs.',
            ]
          : [
              'Pick up 1 ripe plantain, 2 eggs, and 1 tomato/onion at the corner shop.',
              'Slice plantain and shallow-fry in 1 tbsp oil until caramelized and golden (4 mins).',
              'Scramble eggs softly with diced onion and pepper in the same pan (3 mins) and plate warm.',
            ],
      ingredients:
        pass.cuisineAnchor === 'weeknight_comfort'
          ? [
              { name: 'Spaghetti or Pasta', amount: '150g' },
              { name: 'Eggs', amount: '2 large' },
              { name: 'Butter & Garlic', amount: '1 tbsp' },
            ]
          : [
              { name: 'Ripe Plantain', amount: '1 medium' },
              { name: 'Eggs', amount: '2 large' },
              { name: 'Tomato & Onion', amount: '1 small' },
            ],
      chefTip: 'Nothing at home? Pick up these 3 affordable staples on your way back and dinner is ready in 10 minutes.',
    };
  }

  const lower = pantryItems.map((i) => i.toLowerCase().trim());

  const findMatch = (regex: RegExp) => pantryItems.find((name) => regex.test(name.toLowerCase()));
  const hasRice = Boolean(findMatch(/rice/i));
  const hasPlantain = Boolean(findMatch(/plantain|dodo/i));
  const hasYam = Boolean(findMatch(/yam/i));
  const hasBeans = Boolean(findMatch(/bean|lentil/i));
  const hasPasta = Boolean(findMatch(/pasta|spag|macaroni/i));
  const hasNoodles = Boolean(findMatch(/indomie|noodle|ramen/i));
  const hasBread = Boolean(findMatch(/bread|toast|sourdough/i));
  const hasEggs = !isVegan && Boolean(findMatch(/egg/i));
  const hasTomato = Boolean(findMatch(/tomato/i));
  const hasGreens = Boolean(findMatch(/spinach|greens|ugu|kale|cabbage/i));

  // 0. Smart Multi-Ingredient Combinations First (100% Pantry Accuracy)
  const chickenItem = !isVegetarian ? findMatch(/chicken|poultry|turkey/i) : null;
  if (chickenItem && hasRice) {
    return {
      title: hasTomato ? 'Jollof Rice & Peppered Chicken' : 'Stir-Fry Rice & Seared Chicken',
      subtitle: `Made with your ${chickenItem}, rice, and kitchen spices`,
      cookTime: '18 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(2.5, currencyCode, currencySymbol),
      steps: [
        `Season ${chickenItem} with curry, thyme, salt, and pepper; sear in hot oil for 6 mins until golden.`,
        hasTomato
          ? 'Sauté onions and tomatoes in the pan, then fold in rice and simmer until smoky and tender.'
          : 'Toss rice, sliced onions, and spices into the pan and stir-fry for 5 mins.',
        `Top with the seared ${chickenItem}${hasPlantain ? ' and fried plantain slices' : ''} and serve hot.`,
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Let the rice toast slightly at the bottom of the pan for that smoky home flavor.',
    };
  }

  if (chickenItem && hasPlantain) {
    return {
      title: 'Peppered Chicken & Fried Plantain',
      subtitle: 'Juicy pan-seared chicken paired with sweet golden dodo',
      cookTime: '15 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(2.4, currencyCode, currencySymbol),
      steps: [
        'Slice ripe plantains and shallow-fry until golden brown on both sides.',
        `Season ${chickenItem} with pepper, onions, and spices; sear in the same pan for 7 mins.`,
        'Toss the chicken in sautéed onions and pepper sauce; plate beside warm dodo.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Cooking the chicken right after the plantain gives the sauce a subtle sweet aroma.',
    };
  }

  if (chickenItem && (hasPasta || hasNoodles)) {
    return {
      title: hasNoodles ? 'Peppered Indomie & Seared Chicken' : 'Chicken Jollof Spaghetti',
      subtitle: `Savory noodles tossed with tender ${chickenItem} and peppers`,
      cookTime: '14 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(2.3, currencyCode, currencySymbol),
      steps: [
        `Cut ${chickenItem} into strips and sear in a hot pan for 5 mins until golden.`,
        'Add sliced onions, tomatoes, and seasoning with a splash of water.',
        'Simmer pasta or noodles directly in the pan sauce until tender and coated.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Finish on high heat for 60 seconds so the sauce clings to every strand.',
    };
  }

  if (hasBeans && hasPlantain) {
    return {
      title: 'Beans & Fried Plantain (Ewa & Dodo)',
      subtitle: 'Rich stewed beans paired with sweet caramelized plantain',
      cookTime: '14 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(1.9, currencyCode, currencySymbol),
      steps: [
        'Sauté chopped onions and pepper in oil, then stir in beans with a splash of water and simmer 6 mins.',
        'Slice ripe plantains and fry in medium-hot oil until golden on the edges.',
        `Plate the warm stewed beans beside sweet dodo${hasEggs ? ' and a boiled or fried egg' : ''}.`,
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Mash a spoonful of beans into the pepper sauce so it turns rich and creamy.',
    };
  }

  if (hasRice && hasPlantain) {
    return {
      title: hasEggs ? 'Rice, Fried Plantain & Egg' : 'Jollof Rice & Fried Plantain',
      subtitle: 'Warm seasoned rice served with sweet golden plantain',
      cookTime: '15 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(2.0, currencyCode, currencySymbol),
      steps: [
        'Fry sliced plantains in oil for 3 mins per side until golden; set aside.',
        'Sauté onions, tomatoes, and spices in the pan, then toss in rice and warm through.',
        hasEggs
          ? 'Fry an egg in the pan and plate alongside the rice and sweet plantain.'
          : 'Serve the hot seasoned rice with golden plantain on the side.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Slice plantains on a slant so you get more crispy caramelized surface area.',
    };
  }

  if (hasYam && hasEggs) {
    return {
      title: 'Boiled Yam & Pepper Egg Sauce',
      subtitle: 'Soft tender yam paired with rich tomato and onion egg sauce',
      cookTime: '15 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(1.9, currencyCode, currencySymbol),
      steps: [
        'Peel and boil yam slices in salted water for 10 mins until fork-tender.',
        'Sauté sliced onions, diced tomatoes, and scotch bonnet in 1 tbsp oil for 3 mins.',
        'Pour in whisked eggs, let set for 20 seconds, then fold gently into juicy curds.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Take the egg sauce off the heat while still slightly glossy so it stays juicy.',
    };
  }

  const fishCombo = !isVegetarian ? findMatch(/sardine|tuna|mackerel|titus|fish/i) : null;
  if (fishCombo && hasBread) {
    return {
      title: hasEggs ? `Toasted Bread & ${fishCombo} Egg Scramble` : `Pan-Toasted ${fishCombo} Sandwich`,
      subtitle: `Crispy pan-toasted bread loaded with savory ${fishCombo} and onions`,
      cookTime: '8 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(1.7, currencyCode, currencySymbol),
      steps: [
        `Sauté diced onions and pepper in a pan, then flake in ${fishCombo} and warm for 2 mins.`,
        hasEggs
          ? 'Pour whisked eggs over the fish and fold gently until softly scrambled.'
          : 'Season with black pepper and a squeeze of fresh aromatics.',
        'Toast bread slices in the warm pan and pile the savory filling on top.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Use a little oil from the tin to toast the bread for extra flavor.',
    };
  }

  if (fishCombo && hasNoodles) {
    return {
      title: `Peppered Indomie & ${fishCombo}`,
      subtitle: `Saucy spiced noodles tossed with flaked ${fishCombo}${hasEggs ? ' and egg' : ''}`,
      cookTime: '9 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(1.8, currencyCode, currencySymbol),
      steps: [
        `Sauté sliced onions and pepper, then lightly brown ${fishCombo} for 2 mins.`,
        'Add 1.5 cups water and noodle seasoning; bring to a rolling boil.',
        `Simmer noodles for 3 mins until saucy${hasEggs ? ' and top with a fried or poached egg' : ''}.`,
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Add sliced onions at the very end too for a fresh crunch.',
    };
  }

  // 1. Chicken / Poultry
  if (chickenItem) {
    const cost = 2.2;
    const isAfrican = pass.cuisineAnchor !== 'weeknight_comfort';
    return {
      title: hasGreens
        ? 'Seared Chicken & Fresh Greens'
        : isAfrican
        ? 'Peppered Chicken & Onions'
        : 'Garlic Butter Chicken',
      subtitle: 'Tender seared chicken cooked with onions and pantry spices',
      cookTime: '15 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        `Cut ${chickenItem} into bite-sized pieces and season with salt, pepper, and spices.`,
        'Heat 1 tablespoon cooking oil in your pan over medium-high heat.',
        `Sear ${chickenItem} until browned and cooked through, about 6 to 8 minutes.`,
        'Toss with sliced onions and simmer for 2 minutes; serve hot.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Sear chicken without moving it for the first 3 minutes so it browns nicely.',
    };
  }

  // 2. Beef / Steak / Meat
  const beefItem = !isVegetarian ? findMatch(/beef|steak|meat|pork|lamb/i) : null;
  if (beefItem) {
    const cost = 2.5;
    return {
      title: 'Beef & Onion Stir-Fry',
      subtitle: 'Tender beef strips tossed with sliced onions and seasoning',
      cookTime: '12 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        `Slice ${beefItem} into thin strips across the grain for tenderness.`,
        'Heat your pan with a splash of cooking oil.',
        `Sear ${beefItem} quickly for 3 to 4 minutes until browned.`,
        'Fold in sliced onions and seasonings; remove from heat so it stays tender.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'High heat keeps pan-seared beef tender and juicy.',
    };
  }

  // 3. Fish / Tuna / Seafood / Shrimp
  const fishItem = !isVegetarian ? findMatch(/fish|tuna|salmon|mackerel|sardine|tilapia|shrimp|prawn/i) : null;
  if (fishItem) {
    const isShrimp = /shrimp|prawn/i.test(fishItem);
    const cost = 2.2;
    return {
      title: isShrimp ? 'Garlic Butter Shrimp' : `Fried ${fishItem} & Onions`,
      subtitle: `Quick pan-fried ${fishItem} with onions and garlic`,
      cookTime: '10 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Warm 1 tablespoon oil in your pan over medium heat with sliced onions and garlic.',
        `Add ${fishItem} and gently cook until browned and fragrant.`,
        'Season with salt, pepper, and your favorite spices.',
        'Serve warm straight from the pan.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Let the fish brown on one side before flipping so it stays whole.',
    };
  }

  // 4. Sausage
  const sausageItem = !isVegetarian ? findMatch(/sausage|hot dog|frank/i) : null;
  if (sausageItem) {
    const cost = 1.8;
    return {
      title: 'Sausage & Onions',
      subtitle: 'Browned sliced sausage cooked with onions and peppers',
      cookTime: '10 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        `Slice ${sausageItem} into bite-sized rounds.`,
        'Brown in a hot pan for about 4 minutes.',
        'Add sliced onions and peppers; cook until soft.',
        'Serve hot.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Brown the sausage first and cook your onions right in the same pan.',
    };
  }

  // 5. Yam
  const yamItem = findMatch(/yam/i);
  if (yamItem) {
    const hasEggs = lower.some((i) => i.includes('egg')) && !isVegan;
    const cost = 1.6;
    return {
      title: hasEggs ? 'Yam & Egg Sauce' : 'Fried Yam & Pepper Sauce',
      subtitle: 'Tender yam with warm pepper and onion sauce',
      cookTime: '14 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Peel and slice yam into wedges or bite-sized pieces.',
        'Boil in salted water for 8 minutes until fork-tender, then drain.',
        'Sauté sliced onions and pepper in 1 tablespoon oil.',
        hasEggs ? 'Pour in whisked eggs and fold gently until set; serve with yam.' : 'Toss yam with the pepper and onion sauce and serve hot.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'A pinch of salt in the water brings out the natural sweetness of the yam.',
    };
  }

  // 6. Plantains / Dodo
  const plantainItem = findMatch(/plantain|dodo/i);
  if (plantainItem) {
    const hasEggs = lower.some((i) => i.includes('egg')) && !isVegan;
    const cost = 1.6;
    return {
      title: hasEggs ? 'Dodo & Fried Egg' : 'Fried Plantain & Onions',
      subtitle: 'Sweet ripe plantain slices fried with onions',
      cookTime: '10 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Peel and slice ripe plantains into diagonal rounds.',
        'Fry in medium-hot oil for 3 minutes per side until golden brown.',
        hasEggs ? 'Whisk eggs with a pinch of salt and fry beside the plantains.' : 'Toss with sliced onions and a pinch of salt.',
        'Serve warm.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Keep the oil at medium heat so the plantain cooks through without burning.',
    };
  }

  // 7. Potatoes
  const potatoItem = findMatch(/potato/i);
  if (potatoItem) {
    const cost = 1.5;
    return {
      title: 'Fried Potatoes & Onions',
      subtitle: 'Sliced potatoes pan-fried with onions and seasoning',
      cookTime: '14 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Wash and slice potatoes into thin rounds or small cubes.',
        'Heat 1 tablespoon cooking oil in a pan and lay potatoes flat.',
        'Cook undisturbed for 5 minutes until browned on the bottom, then flip.',
        'Add sliced onions and seasonings; cook until tender.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Give potatoes space in the pan so they brown nicely.',
    };
  }

  // 8. Beans / Legumes
  const beanItem = findMatch(/bean|lentil|chickpea/i);
  if (beanItem) {
    const cost = 1.4;
    return {
      title: 'Stewed Beans',
      subtitle: 'Warm seasoned beans simmered with onions and pepper',
      cookTime: '12 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Sauté diced onions and peppers in cooking oil until soft.',
        `Stir in ${beanItem} with a splash of water and seasoning.`,
        'Simmer for 5 minutes while mashing a few spoonfuls to thicken the sauce.',
        'Serve warm.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Mashing a spoonful of beans thickens the stew naturally.',
    };
  }

  // 9a. Pasta / Spaghetti / Macaroni
  if (hasPasta) {
    const cost = 1.5;
    return {
      title: hasTomato
        ? 'Jollof Spaghetti'
        : hasEggs
        ? 'Garlic Butter Pasta & Egg'
        : 'Garlic & Pepper Pasta',
      subtitle: hasTomato
        ? 'Spiced pasta simmered in rich tomato and onion sauce'
        : 'Quick pan-tossed pasta with garlic, oil, and aromatics',
      cookTime: '14 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Boil pasta in salted water for 8 minutes until al dente; reserve 3 tbsp cooking water.',
        hasTomato
          ? 'Sauté chopped onions, diced tomatoes, curry, and thyme in 1 tbsp oil for 4 mins.'
          : 'Warm oil in your pan with garlic, sliced onions, and black pepper.',
        'Toss pasta into the sauce with the reserved water until glossy and well coated.',
        hasEggs ? 'Top with a fried or soft-boiled egg and serve hot.' : 'Plate warm and enjoy.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'A splash of starchy pasta water binds the oil and tomato sauce to every strand.',
    };
  }

  // 9b. Noodles / Indomie / Ramen
  const noodleItem = findMatch(/noodle|indomie|ramen/i);
  if (noodleItem) {
    const cost = 1.3;
    return {
      title: hasEggs ? 'Indomie & Fried Egg' : 'Garlic & Chili Noodles',
      subtitle: 'Quick seasoned noodles tossed with onions and pepper',
      cookTime: '8 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Boil noodles in water for 3 minutes until tender.',
        'Warm oil in your pan with sliced onions, garlic, and seasoning.',
        'Toss hot noodles into the pan with 2 spoonfuls of cooking water.',
        hasEggs ? 'Top with a fried egg and serve hot.' : 'Toss well and serve hot.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Keep two spoonfuls of cooking water so the noodles stay saucy.',
    };
  }

  // 10. Rice
  const riceItem = findMatch(/rice/i);
  if (riceItem) {
    const hasEggs = lower.some((i) => i.includes('egg')) && !isVegan;
    const cost = 1.4;
    return {
      title: hasEggs ? 'Fried Rice & Egg' : 'Seasoned Fried Rice',
      subtitle: 'Pan-toasted rice with onions and spices',
      cookTime: '12 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Heat 1 tablespoon of cooking oil in your pan over medium heat.',
        'Stir in chopped onions and seasonings until fragrant.',
        'Add rice and stir-fry for 3 to 4 minutes until heated through.',
        hasEggs ? 'Push rice aside, fry an egg in the pan, and mix together.' : 'Serve hot.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Stir-fry rice on medium-high heat so every grain stays separate.',
    };
  }

  // 11. Mushrooms / Fungi
  const mushroomItem = findMatch(/mushroom/i);
  if (mushroomItem) {
    const cost = 1.6;
    return {
      title: 'Garlic & Herb Mushrooms',
      subtitle: 'Browned mushrooms cooked with garlic and herbs',
      cookTime: '10 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Slice mushrooms and place in a hot dry pan for 2 minutes.',
        'Add oil or butter and sliced garlic; cook until browned.',
        'Season with salt, black pepper, and herbs.',
        'Serve warm.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Cooking mushrooms dry for 2 minutes first helps them brown instead of steaming.',
    };
  }

  // 12. Spinach / Greens
  const greensItem = findMatch(/spinach|kale|greens|cabbage/i);
  if (greensItem) {
    const cost = 1.3;
    return {
      title: `Sautéed ${greensItem} & Garlic`,
      subtitle: `Fresh ${greensItem} cooked quickly with onions and garlic`,
      cookTime: '8 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Heat oil in your pan and cook sliced garlic and onions until fragrant.',
        `Add ${greensItem} and stir gently for 2 to 3 minutes until wilted.`,
        'Season with a pinch of salt and pepper.',
        'Serve warm.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Take greens off the heat as soon as they wilt so they stay bright and tender.',
    };
  }

  // 13. Tofu
  const tofuItem = findMatch(/tofu/i);
  if (tofuItem) {
    const cost = 1.6;
    return {
      title: 'Fried Tofu & Peppers',
      subtitle: 'Browned tofu cubes tossed with peppers and onions',
      cookTime: '12 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Cut tofu into bite-sized cubes and pat dry.',
        'Pan-fry in hot oil for 4 minutes per side until browned.',
        'Add sliced onions and peppers with seasoning.',
        'Toss together for 2 minutes and serve hot.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Pat tofu dry before frying so it browns evenly.',
    };
  }

  // 14. Eggs (if not vegan)
  const eggItem = !isVegan ? findMatch(/egg/i) : null;
  if (eggItem) {
    const hasTomatoes = lower.some((i) => i.includes('tomato'));
    const cost = 1.3;
    return {
      title: hasTomatoes ? 'Tomato & Egg Sauce' : 'Scrambled Eggs & Onions',
      subtitle: 'Soft seasoned eggs cooked with onions and tomatoes',
      cookTime: '8 min',
      gear: pass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(cost, currencyCode, currencySymbol),
      steps: [
        'Sauté chopped onions and peppers in 1 tablespoon of cooking oil.',
        hasTomatoes ? 'Add diced tomatoes and cook for 3 minutes until soft.' : 'Season with a pinch of salt and pepper.',
        'Whisk eggs and pour into the pan.',
        'Fold gently on low heat until set and serve warm.',
      ],
      ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
      chefTip: 'Cook eggs on low heat so they stay soft and tender.',
    };
  }

  // 15. ANY OTHER CUSTOM INGREDIENT
  const heroCustom = pantryItems.find((i) => !/(oil|salt|curry|thyme|bouillon|seasoning|water|pepper\b)/i.test(i)) || pantryItems[0];
  const cost = 1.7;
  return {
    title: `Sautéed ${heroCustom} & Onions`,
    subtitle: `Quick home meal made with ${heroCustom} and kitchen staples`,
    cookTime: '12 min',
    gear: pass.cookingGearLabel || '1 Pan',
    estCost: convertMealCost(cost, currencyCode, currencySymbol),
    steps: [
      'Heat 1 tablespoon of cooking oil in your pan over medium heat.',
      `Add ${heroCustom} and sliced onions; cook for 5 to 7 minutes until tender.`,
      'Season with salt, pepper, and spices.',
      'Serve warm.',
    ],
    ingredients: pantryItems.map((name) => ({ name, amount: '1 portion' })),
    chefTip: `Cooking onions first builds a flavorful base for ${heroCustom}.`,
  };
}

function buildLocalPantryFallback(pantryItems: string[], pass: UserKitchenPass): AIRecipeResult {
  return buildIntelligentPantryRecipe(pantryItems, pass);
}

/** Normalise a food word so "Eggs" matches "egg", "Tomatoes" matches "tomato", etc. */
export function stemFoodWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/ies$/, 'y')
    .replace(/oes$/, 'o')
    .replace(/s$/, '');
}

/** Meaningful tokens of a pantry item name ("Scotch Bonnet (Ata Rodo)" -> ["scotch", "bonnet", "ata", "rodo"]) */
export function pantryTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z]+/)
    .map(stemFoodWord)
    .filter((t) => t.length >= 3);
}

/** True when the text mentions this pantry item (plural/singular and multi-word safe) */
export function textMentionsPantryItem(text: string, pantryName: string): boolean {
  const lowerText = text.toLowerCase();
  const textWords = new Set(lowerText.split(/[^a-z]+/).map(stemFoodWord));
  const tokens = pantryTokens(pantryName);
  if (tokens.length === 0) return false;
  return tokens.some((t) => textWords.has(t) || lowerText.includes(t));
}

/**
 * Guard against the AI ignoring the user's selection: the recipe must actually use
 * at least one selected item (or two when the user picked several).
 */
function recipeUsesPantry(recipe: AIRecipeResult, pantryItems: string[]): boolean {
  if (pantryItems.length === 0) return true;
  const text = `${recipe.title} ${recipe.ingredients.map((i) => i?.name || '').join(' ')}`;
  const used = pantryItems.filter((item) => textMentionsPantryItem(text, item)).length;
  const required = pantryItems.length >= 2 ? 2 : 1;
  return used >= required;
}

export class AiMamaService {
  /**
   * Request dynamic voice line for Mama from Groq tailored to user's live culinary context.
   * Fully synchronizes with the child's pantry, weekly budget, time of day, gear, diet, and passed dishes.
   */
  static async getLiveMamaDialogue(
    passOrContext: UserKitchenPass | MamaSyncContext,
    contextHint: 'greeting' | 'tap' | 'discover' | 'cooking' | 'pantry' | 'pass_meal' = 'tap',
    activeDishTitle?: string
  ): Promise<string> {
    // Discriminate between MamaSyncContext and raw UserKitchenPass
    const isContextObj = 'pass' in passOrContext;
    const pass = isContextObj ? passOrContext.pass : passOrContext;
    const syncCtx: MamaSyncContext = isContextObj
      ? passOrContext
      : {
          timeOfDay: 'dinner',
          pass,
          activeDish: activeDishTitle ? { title: activeDishTitle } : undefined,
          actionHint: contextHint === 'pass_meal' ? 'pass_meal' : contextHint === 'discover' ? 'discover_feed' : contextHint === 'pantry' ? 'pantry_review' : 'tap_advice',
        };

    const pantryItems = syncCtx.pantryItems || [];
    const dish = syncCtx.activeDish;
    const dishName = dish?.title || activeDishTitle || '';
    const gearLabel = dish?.gear || pass.cookingGearLabel || '1 Pan';
    const cookMinutes = dish?.cookTimeMinutes || pass.timeLimitMinutes || 15;
    const remainingBudget = pass.weeklyBudget - pass.spentThisWeek;
    const lastPassed = syncCtx.lastPassedDishTitle;
    const effectiveHint = syncCtx.actionHint || contextHint;

    try {
      const dietaryContext =
        pass.dietaryRestrictions && pass.dietaryRestrictions.length > 0
          ? `Dietary preferences: ${pass.dietaryRestrictions.join(', ')}. Strict Rule: NEVER mention forbidden ingredients or meat/dairy if plant-based.`
          : '';

      const goalInstruction =
        pass.bodyGoal === 'curves_glutes'
          ? 'Goal: Curves & Glutes. In 1 short warm sentence, subtly reassure your child how the wholesome protein or sustaining slow carbs in this dish feed their curves and hips naturally.'
          : pass.bodyGoal === 'reduce_weight'
          ? 'Goal: Weight Loss (Lean & Light). In 1 short warm sentence, subtly reassure your child that this dish is light, gentle on oil, and keeps them energized and lean.'
          : pass.bodyGoal === 'add_weight'
          ? 'Goal: Gain Weight (Healthy Fullness). In 1 short warm sentence, warmly encourage your child to eat hearty, calorie-dense food to build good strength and body weight.'
          : 'Goal: Balanced Energy. In 1 short warm sentence, reassure your child this wholesome home meal gives them steady stamina without feeling heavy.';

      const systemPrompt = `You are "Mama", the user's caring, loving home-cook mother and intuitive nutritionist in the "Mama Kitchen" app.
You know your child's exact kitchen, wallet, and body goal:
- Country: ${pass.countryName} (Currency: ${pass.currencySymbol})
- Cooking Gear: ${gearLabel}
- Max Time Limit: ${cookMinutes} mins
- Kitchen Pantry: ${pantryItems.length > 0 ? pantryItems.join(', ') : 'Empty pantry - needs staples'}
- Weekly Budget: ${pass.currencySymbol}${Math.round(remainingBudget)} remaining out of ${pass.currencySymbol}${pass.weeklyBudget}
- Body Goal: ${pass.bodyGoalLabel || 'Balanced Energy'}. ${goalInstruction}
${dietaryContext}

Tone & Rules:
1. Warm, maternal, affectionate ("my child", "my dear").
2. Speak like a loving African mother who understands natural home nutrition. Zero scientific jargon (never say "caloric deficit", "grams of protein", or "macronutrients").
3. Exactly ONE comforting, natural sentence (under 25 words).
4. Strictly NO emojis anywhere in the response.
5. Grounded in actual reality — do NOT invent ingredients or claim you have food not in the pantry.`;

      let userPrompt = '';
      if (effectiveHint === 'pass_meal' && lastPassed) {
        userPrompt = `I just passed on ${lastPassed}. You are showing me ${dishName}. Warmly acknowledge this and tell me in 1 sentence why ${dishName} is a great choice tonight for my body.`;
      } else if ((effectiveHint === 'tap_advice' || effectiveHint === 'cook_start') && dishName) {
        userPrompt = `Give me your secret 1-sentence kitchen and nutrition tip on how to cook ${dishName} deliciously using my ${gearLabel}.`;
      } else if (effectiveHint === 'discover_feed' || effectiveHint === 'discover') {
        userPrompt = `Give me a warm 1-sentence motherly nudge to find something delicious that fits my ${pass.currencySymbol}${Math.round(remainingBudget)} budget.`;
      } else if (effectiveHint === 'pantry_review' || effectiveHint === 'pantry') {
        userPrompt = pantryItems.length > 0
          ? `Reassure me that with ${pantryItems.slice(0, 3).join(', ')} in my kitchen, we can eat warmly tonight.`
          : `Gently encourage me to add a few basic ingredients to my kitchen so you can cook for me.`;
      } else if (dishName) {
        userPrompt = `Say 1 warm motherly sentence introducing ${dishName} for ${syncCtx.timeOfDay || 'dinner'}, subtly connecting it to my ${pass.bodyGoalLabel || 'body'} goal.`;
      } else {
        userPrompt = `Say something comforting and practical to your child about tonight's dinner.`;
      }

      const data = await callGroqChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.7, maxTokens: 60, timeoutMs: 4500, tier: 'fast' }
      );

      const quote = data?.choices?.[0]?.message?.content?.trim();
      if (quote && quote.length > 5) {
        return quote.replace(/^["']|["']$/g, '');
      }
    } catch {
      // Quiet fallback
    }

    // High fidelity synced fallback
    return MamaDialogueService.getSyncedMamaVoice(syncCtx).quote;
  }

  /**
   * Generate an authentic, tailored 1-pan recipe based on scanned or selected pantry items
   */
  static async generateRecipeFromPantry(
    pantryItems: string[],
    pass: UserKitchenPass
  ): Promise<AIRecipeResult> {
    const fallback = buildLocalPantryFallback(pantryItems, pass);

    try {
      const dietaryRule =
        pass.dietaryRestrictions && pass.dietaryRestrictions.length > 0
          ? `Strict Dietary Requirements: ${pass.dietaryRestrictions.join(', ')}. NEVER include forbidden ingredients or allergens.`
          : '';

      const systemPrompt = `You are Mama, a loving home cook in the Mama Kitchen app.
Generate ONE realistic, fast, comforting home recipe the user can cook RIGHT NOW with what they already have.
Constraints:
- User Country: ${pass.countryName} (${pass.currencyCode})
- Cuisine anchor: ${pass.cuisineLabel}
- Gear: ${pass.cookingGearLabel || '1 Pan'}
- Max cook time: ${pass.timeLimitMinutes || 15} minutes
- Body goal: ${pass.bodyGoalLabel || 'Balanced Energy'}
${dietaryRule}
Ingredient Rules (MOST IMPORTANT):
- The dish MUST be built around the user's selected items. Use as many of them as make sense together (at least 2 when 2 or more are given).
- You may ONLY add basic cupboard staples on top: cooking oil, salt, black pepper, chili/pepper, onion, garlic, seasoning cube, water, tomato paste.
- NEVER require any other ingredient the user did not list (no surprise proteins, vegetables, or dairy).
- If two items do not belong together, leave one out rather than forcing a strange dish.
Title Rules:
- Title MUST be a simple, short (2 to 4 words) everyday home dish name (e.g. "Dodo & Fried Egg", "Jollof Spaghetti", "Garlic Rice & Egg", "Yam & Egg Sauce").
- NEVER use buzzwords like "Skillet", "Sizzle", "Bowl", "Frittata", "Hash", "Crispy", "Golden", "Savory", "Velvety", or "1-Pan" in the title.
- Strictly return valid JSON matching this schema:
{
  "title": string,
  "subtitle": string,
  "cookTime": string,
  "gear": "${pass.cookingGearLabel || '1 Pan'}",
  "estCost": string,
  "steps": string[],
  "ingredients": [ { "name": string, "amount": string } ],
  "chefTip": string
}`;

      const userPrompt = `My selected kitchen items: ${pantryItems.join(', ')}. Local currency: ${pass.currencySymbol}. Return pure JSON.`;

      const data = await callGroqChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { jsonMode: true, temperature: 0.45, maxTokens: 800, timeoutMs: 7000 }
      );

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned empty response');
      }
      const parsed = JSON.parse(content) as AIRecipeResult;
      const hasShape =
        typeof parsed.title === 'string' &&
        Array.isArray(parsed.steps) &&
        parsed.steps.length > 0 &&
        Array.isArray(parsed.ingredients) &&
        parsed.ingredients.length > 0;
      if (!hasShape || !recipeUsesPantry(parsed, pantryItems)) {
        throw new Error('Groq recipe does not use pantry or lacks valid shape');
      }
      return {
        ...parsed,
        title: sanitizeDishTitle(parsed.title),
        gear: parsed.gear || pass.cookingGearLabel || '1 Pan',
        chefTip: parsed.chefTip || fallback.chefTip,
        // AI-guessed prices are unreliable; keep our localized estimate
        estCost: fallback.estCost,
      };
    } catch {
      try {
        const srvRecipe = await apiClient<any>('/api/recipes/generate', {
          method: 'POST',
          skipAuth: true,
          timeoutMs: 7500,
          body: JSON.stringify({ availableIngredients: pantryItems }),
        });
        if (srvRecipe?.title) {
          const steps = Array.isArray(srvRecipe.steps)
            ? srvRecipe.steps
            : Array.isArray(srvRecipe.instructions)
            ? srvRecipe.instructions.map((s: any) => (typeof s === 'string' ? s : s.instruction)).filter(Boolean)
            : fallback.steps;
          const ingredients = Array.isArray(srvRecipe.ingredients)
            ? srvRecipe.ingredients.map((i: any) => (typeof i === 'string' ? { name: i, amount: '1 portion' } : i))
            : Array.isArray(srvRecipe.ingredientsUsed)
            ? srvRecipe.ingredientsUsed.map((name: string) => ({ name, amount: '1 portion' }))
            : fallback.ingredients;
          return {
            title: sanitizeDishTitle(srvRecipe.title),
            subtitle: srvRecipe.subtitle || srvRecipe.description || fallback.subtitle,
            cookTime: `${srvRecipe.cookTimeMinutes || 12} min`,
            gear: pass.cookingGearLabel || '1 Pan',
            estCost: fallback.estCost,
            steps: steps.length > 0 ? steps : fallback.steps,
            ingredients: ingredients.length > 0 ? ingredients : fallback.ingredients,
            chefTip: srvRecipe.chefTip || srvRecipe.mamaTip || fallback.chefTip,
          };
        }
      } catch {
        // Fallback seamlessly to local intelligent recipe
      }
    }

    return fallback;
  }

  /**
   * Generate a culturally-tailored Discover Deck using live Groq AI (with offline regional fallback)
   */
  static async generateDiscoverDeck(
    pass: UserKitchenPass,
    pantryItems: string[] = []
  ): Promise<AIDiscoveryMeal[]> {
    const neverShow = (pass.neverShowDishes || []).map((t) => t.toLowerCase());
    const diets = (pass.dietaryRestrictions || []).map((d) => d.toLowerCase());

    try {
      const dietaryPrompt =
        diets.length > 0 && !diets.includes('none')
          ? `Strict Dietary Restrictions: ${diets.join(', ')}. NEVER include forbidden ingredients.`
          : '';
      const isAfricanOrIsland = pass.cuisineAnchor === 'african_caribbean';
      const baseExamples = isAfricanOrIsland
        ? 'rice, yam, plantain, beans, noodles, soups, eggs, chicken, fish'
        : 'pasta, potatoes, rice, bread/sourdough, tortillas, oats, chicken, salmon, eggs, fresh veggies';

      const systemPrompt = `You are Mama, a warm local home-cooking mother figure in ${pass.countryName}.
Generate 5 distinct, realistic everyday home meals for a user living in ${pass.countryName}.
Cuisine style: ${pass.cuisineLabel || 'Everyday Comfort'}
Cooking gear: ${pass.cookingGearLabel || '1 Pan & Burner'}
Max cook time: ${pass.timeLimitMinutes || 20} minutes
Body goal: ${pass.bodyGoalLabel || 'Balanced Energy'}
${dietaryPrompt}
${pantryItems.length > 0 ? `Available pantry items: ${pantryItems.join(', ')}` : ''}
${neverShow.length > 0 ? `Never suggest: ${neverShow.join(', ')}` : ''}

Rules:
1. STRICT REGIONAL IDENTITY: Every single dish MUST belong authentically to ${pass.countryName} (${pass.cuisineLabel || 'Everyday Comfort'}) using normal local supermarket staples. NEVER mix in dishes or specialty ingredients from unrelated continents.
2. Every dish title MUST be a real, simple 2-4 word everyday meal name people actually say at home (NO restaurant buzzwords like Skillet, Bowl, Sizzle, Medley, Artisan, Crusted, Velvety).
3. Make all 5 dishes genuinely different from each other (vary the base: ${baseExamples}).
4. Output strictly JSON:
{
  "meals": [
    {
      "id": string,
      "cookTimeOrDistance": "15 MIN",
      "title": string,
      "nutrition": string,
      "reason": string,
      "baseCostUsd": number,
      "steps": [string, string, string],
      "ingredients": [{ "name": string, "amount": string }]
    }
  ]
}`;

      const data = await callGroqChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 5 varied everyday ${pass.cuisineLabel} meals now. Output JSON.` },
        ],
        { jsonMode: true, temperature: 0.85, maxTokens: 1100, timeoutMs: 7000 }
      );

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned empty discover response');
      }
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed?.meals) || parsed.meals.length === 0) {
        throw new Error('Groq returned empty discover meals array');
      }
      return parsed.meals.map((m: any, idx: number) => ({
        id: m.id || `ai-disc-${Date.now()}-${idx}`,
        categoryType: 'home' as const,
        cookTimeOrDistance: String(m.cookTimeOrDistance || '15 MIN').toUpperCase(),
        title: sanitizeDishTitle(m.title || 'Home Meal'),
        nutrition: m.nutrition || 'Balanced Home Meal',
        reason: m.reason || `Cooks easily with ${pass.cookingGearLabel}.`,
        imageUrl: '',
        baseCostUsd: typeof m.baseCostUsd === 'number' && Number.isFinite(m.baseCostUsd)
          ? (m.baseCostUsd > 50 ? Math.max(1.0, Math.min(4.0, Number((m.baseCostUsd / 1400).toFixed(2)))) : m.baseCostUsd)
          : 2.2,
        cuisineTags: [pass.cuisineAnchor || 'african_caribbean'],
        steps: Array.isArray(m.steps) && m.steps.length > 0 ? m.steps : ['Prep ingredients.', 'Cook on medium heat.', 'Serve warm.'],
        ingredients:
          Array.isArray(m.ingredients) && m.ingredients.length > 0
            ? m.ingredients
            : [{ name: 'Kitchen Staples', amount: '1 portion' }],
      }));
    } catch {
      try {
        const srvDisc = await apiClient<{ meals?: any[] }>('/api/discover', {
          method: 'POST',
          skipAuth: true,
          timeoutMs: 7500,
          body: JSON.stringify({ pantryItems, kitchenPass: pass }),
        });
        if (Array.isArray(srvDisc?.meals) && srvDisc.meals.length > 0) {
          return srvDisc.meals.map((m: any, idx: number) => ({
            id: m.id || `ai-disc-${Date.now()}-${idx}`,
            categoryType: 'home' as const,
            cookTimeOrDistance: `${m.cookTimeMinutes || 15} MIN`,
            title: sanitizeDishTitle(m.title || 'Home Meal'),
            nutrition: m.nutrition || 'Balanced Home Meal',
            reason: m.subtitle || `Cooks easily with ${pass.cookingGearLabel}.`,
            imageUrl: '',
            baseCostUsd: typeof m.baseCostUsd === 'number' ? m.baseCostUsd : 2.2,
            cuisineTags: Array.isArray(m.cuisineTags) ? m.cuisineTags : [pass.cuisineAnchor || 'african_caribbean'],
            steps: Array.isArray(m.steps) && m.steps.length > 0 ? m.steps : ['Prep ingredients.', 'Cook on medium heat.', 'Serve warm.'],
            ingredients: Array.isArray(m.ingredients) && m.ingredients.length > 0 ? m.ingredients : [{ name: 'Kitchen Staples', amount: '1 portion' }],
          }));
        }
      } catch {
        // Fall through to offline regional catalog
      }
    }

    let baseMeals: AIDiscoveryMeal[] = [];
    if (pass.cuisineAnchor === 'african_caribbean') {
      baseMeals = [...REGIONAL_FALLBACK_MEALS.african_caribbean];
    } else if (pass.cuisineAnchor === 'weeknight_comfort') {
      baseMeals = [...REGIONAL_FALLBACK_MEALS.weeknight_comfort];
    } else if (pass.cuisineAnchor === 'global') {
      baseMeals = [
        ...REGIONAL_FALLBACK_MEALS.african_caribbean.slice(0, 5),
        ...REGIONAL_FALLBACK_MEALS.weeknight_comfort.slice(0, 5),
      ];
    } else {
      const isWestern = ['GB', 'US', 'CA', 'EU', 'AU'].includes(pass.country);
      baseMeals = isWestern
        ? [...REGIONAL_FALLBACK_MEALS.weeknight_comfort]
        : [...REGIONAL_FALLBACK_MEALS.african_caribbean];
    }

    if (neverShow.length > 0) {
      const allowed = baseMeals.filter((m) => !neverShow.includes(m.title.toLowerCase()));
      if (allowed.length > 0) baseMeals = allowed;
    }

    const isVegan = diets.some((d) => d.includes('vegan'));
    const isVegetarian = isVegan || diets.some((d) => d.includes('vegetarian'));
    const isDairyFree = diets.some((d) => d.includes('dairy'));
    const isGlutenFree = diets.some((d) => d.includes('gluten'));

    const meatTerms = ['chicken', 'beef', 'fish', 'tuna', 'sausage', 'meat', 'pork', 'shrimp', 'salmon'];
    const nonVeganTerms = [...meatTerms, 'egg', 'cheese', 'milk', 'butter', 'cheddar'];
    const dairyTerms = ['cheese', 'milk', 'butter', 'cheddar'];
    const glutenTerms = ['bread', 'spaghetti', 'pasta', 'indomie', 'noodles', 'sourdough', 'tortilla', 'flatbread'];

    if (diets.length > 0 && !diets.includes('no preference') && !diets.includes('none')) {
      const compliant = baseMeals.filter((m) => {
        const text = `${m.title} ${m.reason} ${m.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();
        if (isVegan && nonVeganTerms.some((t) => text.includes(t))) return false;
        if (isVegetarian && meatTerms.some((t) => text.includes(t))) return false;
        if (isDairyFree && dairyTerms.some((t) => text.includes(t))) return false;
        if (isGlutenFree && glutenTerms.some((t) => text.includes(t))) return false;
        return true;
      });
      if (compliant.length > 0) {
        baseMeals = compliant;
      }
    }

    return baseMeals;
  }

  /**
   * Roll a live AI meal tailored to time of day, user gear, and pantry
   */
  static async rollMealWithAI(
    timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night',
    pass: UserKitchenPass,
    pantryItems: string[] = [],
    passedTitles: string[] = []
  ): Promise<{
    id: string;
    title: string;
    subtitle: string;
    timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night';
    cookTimeMinutes: number;
    estCost: number;
    pantryNote: string;
    mamaTip?: string;
    ingredients: { name: string; amount: string }[];
    steps: string[];
  } | null> {
    const isAfricanOrIsland = pass.cuisineAnchor === 'african_caribbean';

    const anglesByPeriod: Record<'morning' | 'lunch' | 'dinner' | 'late_night', string[]> = {
      morning: [
        'a quick, energizing breakfast that can be cooked in minutes with warm carbs and satisfying protein',
        'a vibrant, high-protein morning scramble, omelette, or savory porridge that fuels focus and energy',
        'a simple, warm toasted or comforting morning staple with eggs or savory sauce',
      ],
      lunch: [
        'a savory, aromatic grain, rice, or pasta dish that hits the midday hunger spot',
        'a hearty, nutrient-dense legume, root, or carb-and-protein home favorite',
        'a fast, high-protein pan sauté with fresh vegetables, onions, and local seasoning',
      ],
      dinner: [
        'a deeply comforting evening home plate that warms the soul after a long day',
        'a light, soothing broth or seasoned pan-seared fish or chicken with greens',
        'a fast, budget-friendly 1-pan dinner with rich local flavors and zero wasted food',
        'a comforting homestyle sauce or stew paired with a tender local staple',
      ],
      late_night: [
        'a quick, soothing under-10-minute late-night fix that is gentle on digestion',
        'a cozy, savory warm egg, toast, or noodle dish with gentle spices',
      ],
    };
    const periodAngles = anglesByPeriod[timeOfDay] || anglesByPeriod.dinner;
    const randomAngle = periodAngles[Math.floor(Math.random() * periodAngles.length)];

    try {
      const dietaryPrompt =
        pass.dietaryRestrictions && pass.dietaryRestrictions.length > 0
          ? `Dietary Requirements: ${pass.dietaryRestrictions.join(', ')}. Strict Rule: NEVER include forbidden ingredients, allergens, or non-compliant foods.`
          : '';

      let goalPrompt = '';
      if (pass.bodyGoal === 'curves_glutes') {
        goalPrompt = isAfricanOrIsland
          ? 'Body & Wellness Goal: Curves & Glutes (Hips & Body Fullness). Prioritize wholesome natural protein (eggs, mackerel/fish, chicken, beans, beef) paired with complex slow-burning carbs (boiled yam, plantains, sweet potato, oats).'
          : 'Body & Wellness Goal: Curves & Glutes (Hips & Body Fullness). Prioritize wholesome natural protein (eggs, salmon, chicken, beans, lean beef) paired with complex slow-burning carbs (sweet potato, potatoes, oats, sourdough, rice).';
      } else if (pass.bodyGoal === 'reduce_weight') {
        goalPrompt =
          'Body & Wellness Goal: Lean & Light (Weight Loss). Prioritize high protein, fresh leafy greens, light broths or pan-seared proteins, and light cooking oil.';
      } else if (pass.bodyGoal === 'add_weight') {
        goalPrompt = isAfricanOrIsland
          ? 'Body & Wellness Goal: Gain Weight & Stamina (Healthy Bulk). Prioritize calorie-dense wholesome staples (yam, rice, beans, plantains, comforting stews).'
          : 'Body & Wellness Goal: Gain Weight & Stamina (Healthy Bulk). Prioritize calorie-dense wholesome staples (pasta, potatoes, rice, hearty proteins, avocado, olive oil).';
      } else {
        goalPrompt =
          'Body & Wellness Goal: Balanced Energy. Prioritize wholesome, balanced home staples that give steady stamina throughout the day.';
      }

      const emptyPantryExamples = isAfricanOrIsland
        ? 'eggs, plantain, yam, indomie, rice, tomatoes'
        : 'eggs, pasta, bread, potatoes, chicken, rice';

      const neverShow = pass.neverShowDishes || [];
      const sessionPassed = passedTitles || [];

      const systemPrompt = `You are Mama, a loving, wise local home-cook mother figure in ${pass.countryName}.
Suggest ONE realistic everyday home meal for ${timeOfDay}.
User Country: ${pass.countryName} (${pass.currencyCode}), Cooking Gear: ${pass.cookingGearLabel || '1 Pan'}, Time: under ${pass.timeLimitMinutes || 15} mins, Cuisine: ${pass.cuisineLabel}.
Creative Direction: Explore ${randomAngle}.
${goalPrompt}
${dietaryPrompt}
${pantryItems.length > 0
  ? `Pantry Staples at Home: ${pantryItems.join(', ')}. Prioritize using 2+ of these exact items so user can cook immediately without shopping!`
  : `EMPTY PANTRY: User has no food at home and is deciding what to cook to pick up 2-3 cheap, basic local staples at the market (e.g. ${emptyPantryExamples}). Set "pantryNote" to "Market run: 3 simple staples to pick up".`}
${neverShow.length > 0 ? `NEVER suggest: ${neverShow.join(', ')}.` : ''}
${sessionPassed.length > 0 ? `Avoid recent skips: ${sessionPassed.join(', ')}.` : ''}

Rules:
1. STRICT REGIONAL IDENTITY: You are the local Mama of ${pass.countryName} (${pass.cuisineLabel}). Suggest ONLY an authentic everyday home meal eaten in ${pass.countryName} using normal local grocery ingredients. NEVER mix in dishes or specialty ingredients from unrelated continents.
2. Short title (2-4 words, real home dish name). No buzzwords like "skillet", "crispy", "golden", "frittata", "bowl", "hash", "loaded".
3. Realistic home ingredients with amounts (e.g. "2 large", "1 cup", "1 tbsp").
4. 3 practical steps with real times.
5. "mamaTip": warm 1-sentence cooking/nutrition tip from Mama (<18 words, zero emojis).
6. "estCost": base USD between 1.0 and 3.5.

Strictly output JSON:
{
  "id": string,
  "title": string,
  "subtitle": string,
  "timeOfDay": "${timeOfDay}",
  "cookTimeMinutes": number,
  "estCost": number,
  "pantryNote": string,
  "mamaTip": string,
  "ingredients": [{ "name": string, "amount": string }],
  "steps": string[]
}`;

      const userPrompt = `Roll a fresh, distinct ${timeOfDay} meal now (seed ${Date.now() % 10000}). Output pure JSON.`;

      const data = await callGroqChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { jsonMode: true, temperature: 0.85, maxTokens: 380, timeoutMs: 7000 }
      );

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned empty response');
      }

      const parsed = JSON.parse(content);
      if (!parsed?.title || !Array.isArray(parsed?.steps) || parsed.steps.length === 0) {
        throw new Error('Groq returned invalid meal payload');
      }

      const cleanTitle = sanitizeDishTitle(parsed.title);
      let rawCost = typeof parsed.estCost === 'number' && Number.isFinite(parsed.estCost) ? parsed.estCost : 2.0;
      if (rawCost > 50) {
        // Normalize local currency back to USD base (1.0 to 4.0)
        rawCost = Math.max(1.0, Math.min(4.0, Number((rawCost / 1400).toFixed(2))));
      }
      const aiMeal = {
        id: parsed.id || `ai-roll-${Date.now()}`,
        title: cleanTitle,
        subtitle: parsed.subtitle || `Cooks in ${parsed.cookTimeMinutes || 12} mins with ${pass.cookingGearLabel}`,
        timeOfDay,
        cookTimeMinutes: parsed.cookTimeMinutes || 12,
        estCost: rawCost,
        pantryNote: parsed.pantryNote || 'Uses your kitchen setup',
        mamaTip: parsed.mamaTip || `Heat your pan well before cooking ${cleanTitle} so every bite is flavorful!`,
        ingredients: Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
          ? parsed.ingredients
          : [{ name: 'Staple', amount: '1 portion' }],
        steps: Array.isArray(parsed.steps) ? parsed.steps : ['Prepare ingredients in pan.', 'Cook until browned.', 'Serve warm.'],
      };
      if (!cachedAiRolledMeals.some((m) => m.title === aiMeal.title)) {
        cachedAiRolledMeals.unshift(aiMeal);
        if (cachedAiRolledMeals.length > 12) cachedAiRolledMeals.pop();
      }
      if (__DEV__) {
        console.log(
          `[Mama AI] Rolled "${aiMeal.title}" · ${aiMeal.cookTimeMinutes} min · pantry: ${
            pantryItems.length > 0 ? pantryItems.join(', ') : 'EMPTY (market run)'
          } · note: ${aiMeal.pantryNote}`
        );
      }
      return aiMeal;
    } catch (groqErr) {
      if (__DEV__) console.warn('[Mama AI] Groq roll failed, trying backend /api/roll:', String(groqErr));
      // Fallback 1: Try backend /api/roll or /api/discover if client Groq call is rate-limited
      try {
        const backendRolled = await apiClient<any>('/api/roll', {
          method: 'POST',
          skipAuth: true,
          timeoutMs: 8000,
          body: JSON.stringify({
            timeOfDay,
            pantryItems,
            passedTitles,
            kitchenPass: pass,
          }),
        });
        const isHardcodedServerFallback =
          typeof backendRolled?.id === 'string' &&
          /^roll-\d+-(morning|lunch|dinner|latenight)-\d+$/.test(backendRolled.id);
        if (backendRolled?.title && Array.isArray(backendRolled?.steps) && !isHardcodedServerFallback) {
          const cleanTitle = sanitizeDishTitle(backendRolled.title);
          const aiMeal = {
            ...backendRolled,
            id: backendRolled.id || `ai-srv-${Date.now()}`,
            title: cleanTitle,
            timeOfDay,
          };
          if (!cachedAiRolledMeals.some((m) => m.title === aiMeal.title)) {
            cachedAiRolledMeals.unshift(aiMeal);
            if (cachedAiRolledMeals.length > 12) cachedAiRolledMeals.pop();
          }
          return aiMeal;
        }
      } catch {
        // Backend unavailable (e.g. Render cold start). We intentionally do NOT fall back to
        // /api/discover here: it ignores time of day and could serve breakfast at dinner.
      }
      // Fallback 2: Return an unpassed meal from cachedAiRolledMeals if offline
      const unpassedCached = cachedAiRolledMeals.find(
        (m) => !passedTitles.includes(m.title)
      );
      if (unpassedCached) {
        return { ...unpassedCached, id: `${unpassedCached.id}-${Date.now()}` };
      }
      return null;
    }
  }
}
