import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY || '';
const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

const groqClient = groqApiKey
  ? new Groq({ apiKey: groqApiKey, maxRetries: 0, timeout: 6500 })
  : null;

const FAST_GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
];
const QUALITY_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];
const OPENROUTER_FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.3-70b-instruct',
];
let activeServerModel: string | null = null;

function orderedGroqModels(preferFast: boolean): string[] {
  const base = preferFast ? FAST_GROQ_MODELS : QUALITY_GROQ_MODELS;
  if (activeServerModel && base.includes(activeServerModel)) {
    return [activeServerModel, ...base.filter((m) => m !== activeServerModel)];
  }
  return base;
}

export interface PantryAnalysisResult {
  freshProduce: string[];
  proteins: string[];
  pantryStaples: string[];
  seasonings: string[];
  suggestedPairs: string[];
}

export interface GeneratedRecipe {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  ingredientsUsed: string[];
  pantryItemsNeeded: string[];
  instructions: { stepNumber: number; instruction: string; chefNote?: string }[];
  tasteProfile: { savoury: number; acidity: number; sweetness: number; heat: number };
  imagePrompt: string; // Tailored specifically for Flux food rendering
}

export interface DailyEditPayload {
  curatorNote: string;
  makeNowMeal: {
    id: string;
    title: string;
    subtitle?: string;
    timeMinutes: number;
    cookTimeMinutes?: number;
    ingredientsCount: number;
    description: string;
    estimatedCost?: number;
    imagePrompt: string;
    imageUrl?: string;
    tags: string[];
    steps?: string[];
    ingredients?: { name: string; amount: string }[];
  };
  tonightDinner?: {
    id: string;
    title: string;
    subtitle?: string;
    timeMinutes: number;
    cookTimeMinutes?: number;
    description: string;
    estimatedCost?: number;
    imagePrompt: string;
    imageUrl?: string;
    tags?: string[];
    steps?: string[];
    ingredients?: { name: string; amount: string }[];
  };
  eatingOutRecommendation?: {
    spotName: string;
    dishName: string;
    distance: string;
    price: string;
    vibe: string;
    estimatedCost?: number;
  };
}

export interface DiscoverMealCard {
  id: string;
  title: string;
  subtitle: string;
  cookTimeMinutes: number;
  baseCostUsd: number;
  cuisineTags: string[];
  nutrition: string;
  imagePrompt: string;
  imageUrl?: string;
  steps: string[];
  ingredients: { name: string; amount: string }[];
}

export interface DiscoverDeckPayload {
  meals: DiscoverMealCard[];
}

export interface RolledMeal {
  id: string;
  title: string;
  subtitle: string;
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'late_night';
  cookTimeMinutes: number;
  estCost: number;
  pantryNote?: string;
  mamaTip?: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
}

export class GroqService {
  /**
   * Secure server-side LLM proxy for mobile client requests (Zero API keys in APK).
   * Tries Groq LPU models first for sub-second response latency, with OpenRouter fallback.
   */
  static async proxyChatCompletion(params: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
    tier?: 'fast' | 'quality';
  }): Promise<any> {
    const {
      messages,
      jsonMode = false,
      temperature = 0.65,
      maxTokens = 450,
      tier,
    } = params;

    const preferFast = tier === 'fast' || maxTokens <= 750;

    if (groqClient) {
      for (const model of orderedGroqModels(preferFast)) {
        try {
          const completion = await groqClient.chat.completions.create({
            model,
            messages,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
            temperature,
            max_completion_tokens: maxTokens,
          });
          activeServerModel = model;
          return completion;
        } catch {
          if (activeServerModel === model) {
            activeServerModel = null;
          }
        }
      }
    }

    if (openRouterApiKey) {
      for (const orModel of OPENROUTER_FALLBACK_MODELS) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4500);
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            signal: controller.signal,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterApiKey}`,
              'HTTP-Referer': 'https://mamakitchen.app',
              'X-Title': 'Mama Kitchen',
            },
            body: JSON.stringify({
              model: orModel,
              messages,
              ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
              temperature,
              max_tokens: maxTokens,
            }),
          });
          clearTimeout(timer);
          if (res.ok) {
            return await res.json();
          }
        } catch {
          // try next OpenRouter model
        }
      }
    }

    throw new Error('All server AI models unavailable');
  }

  /**
   * Helper to execute a structured JSON prompt with Groq first, OpenRouter fallback
   */
  private static async executeStructuredPrompt<T>(systemPrompt: string, userPrompt: string, fallback: T): Promise<T> {
    if (groqClient) {
      const tryGroqModel = async (model: string): Promise<T | null> => {
        const completion = await groqClient!.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_completion_tokens: 550,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;
        return JSON.parse(content) as T;
      };

      for (const model of orderedGroqModels(true)) {
        try {
          const res = await tryGroqModel(model);
          if (res) {
            activeServerModel = model;
            return res;
          }
        } catch {
          if (activeServerModel === model) {
            activeServerModel = null;
          }
        }
      }
    }

    if (openRouterApiKey) {
      for (const orModel of OPENROUTER_FALLBACK_MODELS) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4500);
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            signal: controller.signal,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterApiKey}`,
              'HTTP-Referer': 'https://mamakitchen.app',
              'X-Title': 'Mama Kitchen',
            },
            body: JSON.stringify({
              model: orModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.6,
              max_tokens: 550,
            }),
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = (await res.json()) as any;
            const content = data?.choices?.[0]?.message?.content;
            if (content) return JSON.parse(content) as T;
          }
        } catch {
          // try next OpenRouter model
        }
      }
    }

    if (!groqClient && !openRouterApiKey) {
      console.warn('[GroqService] No AI API key provided in .env — returning sensible fallback data.');
    }

    return fallback;
  }

  /**
   * Analyze pantry items detected or typed by the user
   */
  static async analyzePantry(items: string[]): Promise<PantryAnalysisResult> {
    const fallback: PantryAnalysisResult = {
      freshProduce: ['Vine tomatoes', 'Spring onions', 'Garlic', 'Baby spinach'],
      proteins: ['Free-range eggs', 'Smoked tofu'],
      pantryStaples: ['Jasmine rice', 'Olive oil', 'Soy sauce'],
      seasonings: ['Toasted sesame oil', 'Black pepper', 'Sea salt'],
      suggestedPairs: ['Tomato and scrambled eggs over steamed rice', 'Garlic sesame spinach bowl'],
    };

    const systemPrompt = `You are the culinary intelligence engine for "Mama", an effortless home cooking mobile app.
Your tone is calm, warm, and practical — zero robotic filler, zero exclamation marks, zero patronizing praise.
Group the input ingredients into: freshProduce, proteins, pantryStaples, seasonings, and provide 2-3 realistic suggestedPairs.
Always output valid JSON strictly matching:
{
  "freshProduce": string[],
  "proteins": string[],
  "pantryStaples": string[],
  "seasonings": string[],
  "suggestedPairs": string[]
}`;

    const userPrompt = `Categorize and analyze these kitchen ingredients: ${items.join(', ')}`;

    return this.executeStructuredPrompt<PantryAnalysisResult>(systemPrompt, userPrompt, fallback);
  }

  /**
   * Generate curated Daily Edit options based on what's currently in the kitchen
   * Acts as the client's culinary advisor: 1 Winner + 1 Alternative
   */
  static async generateDailyEdit(
    pantryItems: string[],
    pass?: {
      country?: string;
      countryName?: string;
      currencyCode?: string;
      currencySymbol?: string;
      weeklyBudget?: number;
      cuisineAnchor?: string;
      cuisineLabel?: string;
      cookingGear?: string;
      cookingGearLabel?: string;
      timeLimitMinutes?: number;
      stapleBase?: string;
      spiceLevel?: string;
      dietaryRestrictions?: string[];
    }
  ): Promise<DailyEditPayload> {
    const cuisine = pass?.cuisineLabel || pass?.cuisineAnchor || 'African & Caribbean comfort';
    const gear = pass?.cookingGearLabel || pass?.cookingGear || '1 pan on a single burner';
    const maxTime = pass?.timeLimitMinutes || 12;
    const country = pass?.countryName || 'Nigeria';
    const currency = pass?.currencySymbol || '₦';
    const isAfrican = pass?.country === 'NG' || pass?.cuisineAnchor === 'african_caribbean' || !pass?.cuisineAnchor;
    const isAsian = pass?.cuisineAnchor === 'asian_comfort';

    const fallback: DailyEditPayload = isAfrican
      ? {
          curatorNote: "Long day? Don't stress. A warm 1-pan dinner with plantains and eggs will set you right.",
          makeNowMeal: {
            id: 'make-now-af',
            title: 'Dodo & Peppered Eggs',
            subtitle: 'Sweet fried dodo paired with loose curds of scotch bonnet peppered eggs.',
            timeMinutes: 9,
            cookTimeMinutes: 9,
            ingredientsCount: 4,
            description: 'Crisped golden plantains folded alongside loose curds of peppered eggs with gentle ata rodo warmth.',
            estimatedCost: 1.8,
            imagePrompt: 'Top-down editorial culinary photograph of golden fried ripe plantain slices and soft scrambled eggs with chopped tomatoes and peppers in a shallow terracotta bowl, warm lighting.',
            tags: ['1-Pan', '9 Minutes', 'Comfort'],
            steps: [
              'Slice ripe plantains into bite-sized rounds.',
              'Shallow-fry plantains in a hot skillet until caramelized and golden (4 mins).',
              'Whisk 2 eggs with a pinch of salt and diced pepper; pour into the pan beside plantains and fold gently for 2 minutes.',
              'Slide onto a plate and enjoy steaming hot.',
            ],
            ingredients: [
              { name: 'Ripe Plantain', amount: '1 medium' },
              { name: 'Eggs', amount: '2 large' },
              { name: 'Scotch Bonnet / Pepper', amount: '1 small diced' },
              { name: 'Vegetable Oil', amount: '2 tbsp' },
            ],
          },
          tonightDinner: {
            id: 'tonight-af',
            title: 'Jollof Rice & Egg',
            subtitle: 'Quick 1-pan jollof-scented rice with runny poached eggs.',
            timeMinutes: 14,
            cookTimeMinutes: 14,
            description: 'Rich slow-simmered tomato and pepper base stirred into warm rice with runny eggs folded in at the end.',
            estimatedCost: 2.2,
            imagePrompt: 'Culinary editorial photograph of savory red tomato and pepper rice with soft fried eggs in a cast iron pan, chopped fresh herbs, warm ambient lighting.',
            tags: ['Rich Flavor', '14 Minutes'],
            steps: [
              'Sauté sliced onions and tomato paste in 1 tbsp oil until fragrant (3 mins).',
              'Stir in cooked rice, pinch of curry and thyme, and splash of water until deeply coated.',
              'Create two wells, crack eggs directly inside, cover pan for 3 minutes until whites are set.',
            ],
            ingredients: [
              { name: 'Cooked Rice', amount: '1.5 cups' },
              { name: 'Tomato Paste', amount: '2 tbsp' },
              { name: 'Eggs', amount: '2' },
              { name: 'Onion & Pepper', amount: '1/2 diced' },
            ],
          },
        }
      : isAsian
      ? {
          curatorNote: "Tired evening? Sizzling garlic, eggs, and warm rice cure everything.",
          makeNowMeal: {
            id: 'make-now-as',
            title: 'Garlic Egg Fried Rice',
            subtitle: 'Golden sizzled egg over warm rice with sesame and scallions.',
            timeMinutes: 7,
            cookTimeMinutes: 7,
            ingredientsCount: 4,
            description: 'Fragrant garlic sizzled in sesame oil with golden fried eggs over warm jasmine rice.',
            estimatedCost: 1.6,
            imagePrompt: 'Top-down editorial culinary photograph of golden crispy fried eggs over steamed jasmine rice with sliced scallions and toasted sesame seeds, dark ceramic bowl.',
            tags: ['1-Pan', '7 Minutes', 'Pantry Staple'],
            steps: [
              'Crisp minced garlic in sesame oil until fragrant (1 min).',
              'Add warm rice, toss to coat in hot oil.',
              'Crack egg in the center, cover for 2 minutes and serve.',
            ],
            ingredients: [
              { name: 'Cooked Rice', amount: '1.5 cups' },
              { name: 'Eggs', amount: '2' },
              { name: 'Garlic & Scallions', amount: '2 cloves, 1 stalk' },
              { name: 'Soy Sauce & Sesame Oil', amount: '1 tbsp each' },
            ],
          },
          tonightDinner: {
            id: 'tonight-as',
            title: 'Soy Scallion Noodles',
            subtitle: 'Fast 1-pan saucy noodles with fried egg topping.',
            timeMinutes: 10,
            cookTimeMinutes: 10,
            description: 'Chewy noodles tossed in dark soy sauce, fresh ginger, and topped with a crispy-edged fried egg.',
            estimatedCost: 2.0,
            imagePrompt: 'Editorial photograph of glossy sauced noodles with sliced spring onions and a fried egg with runny yolk in a matte black ceramic bowl.',
            tags: ['Comfort', '10 Minutes'],
            steps: [
              'Boil noodles for 3 minutes; drain.',
              'In hot skillet, fry sliced ginger and scallions in oil for 1 min, add soy sauce and sugar.',
              'Toss noodles in sauce and top with a fried egg.',
            ],
            ingredients: [
              { name: 'Noodles', amount: '1 pack' },
              { name: 'Egg', amount: '1 large' },
              { name: 'Soy Sauce', amount: '1.5 tbsp' },
              { name: 'Ginger & Scallions', amount: '1 tbsp' },
            ],
          },
        }
      : {
          curatorNote: "Long day? Don't stress. A warm 1-pan dinner will set you right.",
          makeNowMeal: {
            id: 'make-now-std',
            title: 'Cheddar Scrambled Eggs',
            subtitle: 'Velvety eggs with sharp cheddar over toasted sourdough.',
            timeMinutes: 8,
            cookTimeMinutes: 8,
            ingredientsCount: 4,
            description: 'Soft, creamy scrambled eggs folded with aged cheddar over golden butter-toasted bread.',
            estimatedCost: 1.7,
            imagePrompt: 'Close up editorial photograph of golden buttery scrambled eggs with melted cheddar on toasted crusty sourdough bread on a rustic wooden board.',
            tags: ['1-Pan', '8 Minutes', 'Comfort'],
            steps: [
              'Butter bread and toast in hot skillet until golden (2 mins); transfer to plate.',
              'Lower heat, pour in whisked eggs with a knob of butter, gently folding into loose curds (2 mins).',
              'Fold in shredded cheddar, remove from heat, and spoon over toast.',
            ],
            ingredients: [
              { name: 'Eggs', amount: '3 large' },
              { name: 'Cheddar Cheese', amount: '30g shredded' },
              { name: 'Crusty Bread', amount: '2 slices' },
              { name: 'Butter', amount: '1 tbsp' },
            ],
          },
          tonightDinner: {
            id: 'tonight-std',
            title: 'Garlic Butter Pasta',
            subtitle: 'Silky 1-pan pasta with toasted garlic and cracked pepper.',
            timeMinutes: 12,
            cookTimeMinutes: 12,
            description: 'Tender pasta tossed in sizzled garlic butter with plenty of parmesan and fresh black pepper.',
            estimatedCost: 2.2,
            imagePrompt: 'Top-down culinary photograph of glossy spaghetti with golden garlic chips, grated parmesan, and cracked black pepper in a shallow bowl.',
            tags: ['1-Pan', '12 Minutes'],
            steps: [
              'Cook pasta in salted water until al dente.',
              'In a skillet, gently sizzle sliced garlic in butter and olive oil until fragrant.',
              'Toss drained pasta directly into the garlic butter with parmesan and black pepper.',
            ],
            ingredients: [
              { name: 'Pasta', amount: '150g' },
              { name: 'Garlic', amount: '3 cloves' },
              { name: 'Butter & Olive Oil', amount: '1 tbsp each' },
              { name: 'Parmesan', amount: '30g grated' },
            ],
          },
        };

    const systemPrompt = `You are Mama, a top-tier personal culinary advisor.
Your job is not to show 40 recipe links, but to DECIDE FOR THE USER by eliminating noise and presenting:
1. "makeNowMeal" (The One Winner): The fastest, most satisfying home-cooked dinner matching their culinary brief.
2. "tonightDinner" (The One Alternative): A smart, comforting backup option that also respects the brief.

User's Brief:
- Location & Currency: ${country} (${currency})
- Flavor & Cultural Style: ${cuisine}
- Available Kitchen Gear: ${gear} (NEVER suggest oven if 1-pan)
- Hard Cook Time Limit: under ${maxTime} minutes!
- Available Ingredients: ${pantryItems.join(', ')}

Tone: Warm, calm, decisive, reassuring.
NAMING RULE: Dish titles MUST be simple, real 2-4 word everyday food names (e.g. "Dodo & Fried Egg", "Jollof Spaghetti", "Garlic Butter Pasta"). NEVER use pretentious buzzwords like "Skillet", "Sizzled", "Velvety", "Golden", or "Artisan".
Output strictly as JSON matching:
{
  "curatorNote": string,
  "makeNowMeal": {
    "id": string,
    "title": string,
    "subtitle": string,
    "timeMinutes": number,
    "ingredientsCount": number,
    "description": string,
    "estimatedCost": number,
    "imagePrompt": string,
    "tags": string[],
    "steps": string[],
    "ingredients": [{ "name": string, "amount": string }]
  },
  "tonightDinner": {
    "id": string,
    "title": string,
    "subtitle": string,
    "timeMinutes": number,
    "description": string,
    "estimatedCost": number,
    "imagePrompt": string,
    "tags": string[],
    "steps": string[],
    "ingredients": [{ "name": string, "amount": string }]
  }
}`;

    const userPrompt = `Pantry items available: ${pantryItems.join(', ')}. Produce the winner and alternative.`;

    return this.executeStructuredPrompt<DailyEditPayload>(systemPrompt, userPrompt, fallback);
  }

  /**
   * Generate a personalised Discover deck of 6–8 home-cooking meal cards
   * Each card has everything the Discover screen needs: id, title, cookTime, cost, steps, ingredients
   */
  static async generateDiscoverDeck(
    pantryItems: string[],
    pass?: {
      countryName?: string;
      currencyCode?: string;
      currencySymbol?: string;
      weeklyBudget?: number;
      cuisineAnchor?: string;
      cuisineLabel?: string;
      cookingGear?: string;
      cookingGearLabel?: string;
      timeLimitMinutes?: number;
      stapleBase?: string;
      spiceLevel?: string;
      dietaryRestrictions?: string[];
    }
  ): Promise<DiscoverDeckPayload> {
    const cuisine = pass?.cuisineLabel || pass?.cuisineAnchor || 'African & Caribbean comfort';
    const gear = pass?.cookingGearLabel || pass?.cookingGear || '1 pan on a single burner';
    const maxTime = pass?.timeLimitMinutes || 20;
    const country = pass?.countryName || 'Nigeria';
    const currency = pass?.currencySymbol || '₦';

    const fallback: DiscoverDeckPayload = {
      meals: [
        {
          id: 'disc-f-1',
          title: 'Dodo & Fried Egg',
          subtitle: 'Golden dodo with soft scotch bonnet curds.',
          cookTimeMinutes: 10,
          baseCostUsd: 1.9,
          cuisineTags: ['african_caribbean'],
          nutrition: 'Comfort · 420 kcal · 22g protein',
          imagePrompt: 'Top-down editorial photo of golden fried ripe plantain slices and soft scrambled eggs with diced peppers in a shallow terracotta bowl, warm amber lighting.',
          steps: ['Slice ripe plantains and fry in hot oil until golden (4 min).', 'Beat eggs with diced peppers and onion. Scramble in the same pan for 3 min.', 'Plate plantains with eggs and serve immediately.'],
          ingredients: [{ name: 'Ripe Plantain', amount: '1 whole' }, { name: 'Eggs', amount: '2 large' }, { name: 'Red Onion & Pepper', amount: '1 small diced' }, { name: 'Vegetable Oil', amount: '2 tbsp' }],
        },
        {
          id: 'disc-f-2',
          title: 'Jollof Rice & Egg',
          subtitle: 'Jollof-scented one-pan rice with runny eggs.',
          cookTimeMinutes: 14,
          baseCostUsd: 2.2,
          cuisineTags: ['african_caribbean'],
          nutrition: 'Comfort · 510 kcal · 18g protein',
          imagePrompt: 'Culinary editorial photo of savory red tomato and pepper rice with soft fried eggs in a dark cast iron skillet, chopped herbs, warm side lighting.',
          steps: ['Sauté onion and tomato paste in oil until fragrant (3 min).', 'Stir in cooked rice with curry and thyme until deeply coated.', 'Crack eggs into two wells, cover pan 3 min until whites set.'],
          ingredients: [{ name: 'Cooked Rice', amount: '1.5 cups' }, { name: 'Tomato Paste', amount: '2 tbsp' }, { name: 'Eggs', amount: '2' }, { name: 'Onion & Pepper', amount: '½ diced' }],
        },
        {
          id: 'disc-f-3',
          title: 'Garlic Butter Pasta',
          subtitle: 'Silky one-pan pasta with toasted garlic.',
          cookTimeMinutes: 12,
          baseCostUsd: 2.0,
          cuisineTags: ['mediterranean_european', 'comfort_classics'],
          nutrition: 'Comfort · 560 kcal · 16g protein',
          imagePrompt: 'Top-down photo of glossy spaghetti with golden garlic chips, grated parmesan, and cracked black pepper in a shallow bowl.',
          steps: ['Cook pasta in salted water, reserve ¼ cup water.', 'Sizzle sliced garlic in butter and olive oil until fragrant.', 'Toss pasta in garlic butter with parmesan and pasta water.'],
          ingredients: [{ name: 'Spaghetti', amount: '150g' }, { name: 'Garlic', amount: '4 cloves' }, { name: 'Butter & Olive Oil', amount: '1 tbsp each' }, { name: 'Parmesan', amount: '30g' }],
        },
        {
          id: 'disc-f-4',
          title: 'Tofu Sesame Noodles',
          subtitle: 'Fast saucy noodles with sizzled tofu.',
          cookTimeMinutes: 15,
          baseCostUsd: 3.1,
          cuisineTags: ['asian_comfort'],
          nutrition: 'Vegan · 480 kcal · 18g protein',
          imagePrompt: 'Editorial photo of glossy sesame sauced noodles with golden crispy tofu cubes in a matte black bowl, scallion garnish.',
          steps: ['Boil noodles 3 min and drain.', 'Sear cubed tofu in sesame oil until golden (4 min).', 'Toss noodles in soy sauce, chili crisp; top with scallions.'],
          ingredients: [{ name: 'Noodles', amount: '1 bundle' }, { name: 'Firm Tofu', amount: '150g' }, { name: 'Soy Sauce & Sesame Oil', amount: '2 tbsp' }, { name: 'Chili Flakes', amount: '1 tsp' }],
        },
        {
          id: 'disc-f-5',
          title: 'Lemon Chickpea Couscous',
          subtitle: 'Pantry staples in 20 minutes.',
          cookTimeMinutes: 20,
          baseCostUsd: 2.8,
          cuisineTags: ['mediterranean_european'],
          nutrition: 'Vegetarian · 540 kcal · 20g protein',
          imagePrompt: 'Top-down editorial photo of fluffy couscous with golden chickpeas, fresh herbs, and a lemon wedge in a white shallow bowl.',
          steps: ['Steam couscous in boiling water 5 min.', 'Toss chickpeas with lemon juice, cumin, and salt.', 'Fold chickpeas into couscous with fresh herbs.'],
          ingredients: [{ name: 'Couscous', amount: '1 cup' }, { name: 'Canned Chickpeas', amount: '1 can' }, { name: 'Lemon Juice & Olive Oil', amount: '2 tbsp' }, { name: 'Fresh Parsley', amount: 'Handful' }],
        },
        {
          id: 'disc-f-6',
          title: 'Pan-Seared Salmon & Greens',
          subtitle: 'Omega-3 comfort in 25 minutes.',
          cookTimeMinutes: 25,
          baseCostUsd: 4.5,
          cuisineTags: ['mediterranean_european'],
          nutrition: 'High Protein · 610 kcal · 36g protein',
          imagePrompt: 'Editorial photo of seared salmon fillet on a bed of wilted garlic greens with lemon, warm plate, side lighting.',
          steps: ['Season salmon with salt, pepper, and garlic powder.', 'Sear skin-side down 5 min until crisp, flip.', 'Add greens around fillet; squeeze lemon and serve.'],
          ingredients: [{ name: 'Salmon Fillet', amount: '180g' }, { name: 'Leafy Greens', amount: '2 cups' }, { name: 'Garlic', amount: '2 cloves minced' }, { name: 'Lemon', amount: 'Half' }],
        },
      ],
    };

    const systemPrompt = `You are Mama, a personal culinary realtor. Generate exactly 6-8 home-cooking meal cards for the Discover feed.
Each meal must be realistic, achievable with the user's gear, and within budget.
Home meals ONLY (no eating out).

User's Brief:
- Country: ${country} (${currency})
- Cuisine Style: ${cuisine}
- Kitchen Gear: ${gear}
- Max cook time: ${maxTime} minutes
- Available pantry: ${pantryItems.join(', ')}
- Dietary restrictions: ${(pass?.dietaryRestrictions || []).join(', ') || 'none'}

Tone: calm, decisive, warm. NEVER use exclamation marks.
NAMING RULE: Dish titles MUST be simple, real 2-4 word everyday food names (e.g. "Dodo & Fried Egg", "Jollof Rice & Chicken", "Garlic Butter Pasta"). NEVER use pretentious buzzwords like "Skillet", "Sizzled", "Velvety", "Golden", or "Artisan".
Output strictly as JSON:
{
  "meals": [
    {
      "id": string,
      "title": string,
      "subtitle": string,
      "cookTimeMinutes": number,
      "baseCostUsd": number,
      "cuisineTags": string[],
      "nutrition": string,
      "imagePrompt": string,
      "steps": string[],
      "ingredients": [{ "name": string, "amount": string }]
    }
  ]
}`;

    const userPrompt = `Pantry available: ${pantryItems.join(', ')}. Produce 6-8 personalised home meal cards.`;

    return this.executeStructuredPrompt<DiscoverDeckPayload>(systemPrompt, userPrompt, fallback);
  }

  /**
   * Generate an end-to-end recipe from available ingredients
   */
  static async generateRecipe(availableIngredients: string[], titleSuggestion?: string): Promise<GeneratedRecipe> {
    const fallback: GeneratedRecipe = {
      id: 'recipe-tomato-egg',
      title: titleSuggestion || 'Classic Tomato Egg Stir-Fry',
      subtitle: 'Gentle on tired evenings, high comfort',
      description: 'Ripe tomatoes broken down into a sweet-savory broth, folded with velveted eggs and eaten piping hot.',
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      servings: 2,
      difficulty: 'Easy',
      ingredientsUsed: ['3 large ripe tomatoes', '4 free-range eggs', '2 scallions', '1 tbsp neutral oil'],
      pantryItemsNeeded: ['1 tsp soy sauce', '1/2 tsp sugar', 'Pinch of sea salt'],
      instructions: [
        { stepNumber: 1, instruction: 'Whisk eggs with a pinch of salt until slightly frothy.', chefNote: 'Do not overbeat; loose curds stay silkier.' },
        { stepNumber: 2, instruction: 'Sear eggs in a smoking hot pan with half the oil for 40 seconds, then set aside while still soft.', chefNote: 'Pull them out slightly runny; they finish in the tomato sauce.' },
        { stepNumber: 3, instruction: 'In the same pan, cook chopped tomatoes with a splash of water and sugar until saucy and jammy (4-5 minutes).' },
        { stepNumber: 4, instruction: 'Fold the soft eggs back into the hot tomatoes. Scatter sliced scallions and serve hot over rice.' },
      ],
      tasteProfile: { savoury: 8, acidity: 7, sweetness: 4, heat: 1 },
      imagePrompt: 'Professional culinary food photography of authentic Chinese tomato and scrambled eggs served over white rice, steam gently rising, natural soft lighting, warm textured ceramic bowl, shallow depth of field, high resolution.',
    };

    const systemPrompt = `You are an expert chef creating recipes for the Mama cooking app.
Create an achievable, deeply delicious recipe using primarily the available ingredients.
The steps must be clear, human, reassuring, with practical chef notes.
NAMING RULE: The "title" MUST be a simple, real 2-4 word everyday food name (e.g. "Egg Stew & Rice", "Jollof Spaghetti", "Tomato Egg Stir-Fry"). NEVER use pretentious buzzwords like "Skillet", "Sizzled", "Velvety", "Golden", or "Artisan".
Also create an "imagePrompt" specifically optimized for FLUX.1 image generator: specify lighting (soft daylight, warm mood), camera angle (overhead 45-degree angle), tableware (textured ceramic, rustic wood), and appetizing food texture (glossy, steaming).
Output strictly JSON matching:
{
  "id": string,
  "title": string,
  "subtitle": string,
  "description": string,
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "Easy" | "Moderate" | "Advanced",
  "ingredientsUsed": string[],
  "pantryItemsNeeded": string[],
  "instructions": [
    { "stepNumber": number, "instruction": string, "chefNote": string }
  ],
  "tasteProfile": { "savoury": number, "acidity": number, "sweetness": number, "heat": number },
  "imagePrompt": string
}`;

    const userPrompt = `Available ingredients: ${availableIngredients.join(', ')}. Desired meal title: ${titleSuggestion || 'Any quick, satisfying dish'}`;

    return this.executeStructuredPrompt<GeneratedRecipe>(systemPrompt, userPrompt, fallback);
  }

  /**
   * Roll a single, realistic, everyday home meal suggestion
   * Adapts dynamically based on time of day, kitchen pantry items, and recent user decisions.
   * Uses real everyday food names (e.g. "Dodo & Fried Egg", "Bread & Tea", "Indomie & Boiled Egg").
   */
  static async rollMeal(params: {
    timeOfDay?: 'morning' | 'lunch' | 'dinner' | 'late_night';
    pantryItems?: string[];
    passedTitles?: string[];
    recentCookedTitles?: string[];
    kitchenPass?: {
      country?: string;
      countryName?: string;
      currencyCode?: string;
      currencySymbol?: string;
      weeklyBudget?: number;
      cuisineAnchor?: string;
      cuisineLabel?: string;
      cookingGear?: string;
      cookingGearLabel?: string;
      timeLimitMinutes?: number;
      stapleBase?: string;
      spiceLevel?: string;
      dietaryRestrictions?: string[];
      bodyGoal?: string;
    };
  }): Promise<RolledMeal> {
    const timeOfDay = params.timeOfDay || 'dinner';
    const pantryItems = params.pantryItems || [];
    const passedTitles = params.passedTitles || [];
    const recentCookedTitles = params.recentCookedTitles || [];
    const pass = params.kitchenPass;
    const cuisine = pass?.cuisineLabel || pass?.cuisineAnchor || 'African & Caribbean comfort';
    const gear = pass?.cookingGearLabel || pass?.cookingGear || '1 pan on a single burner';
    const maxTime = pass?.timeLimitMinutes || (timeOfDay === 'morning' || timeOfDay === 'late_night' ? 10 : 20);
    const bodyGoal = pass?.bodyGoal;

    const fallbacksByPeriod: Record<'morning' | 'lunch' | 'dinner' | 'late_night', RolledMeal[]> = {
      morning: [
        {
          id: `roll-${Date.now()}-morning-1`,
          title: 'Dodo & Fried Egg',
          subtitle: 'Sweet fried plantain with seasoned eggs.',
          timeOfDay: 'morning',
          cookTimeMinutes: 10,
          estCost: 1.8,
          pantryNote: 'Uses plantain & eggs from your kitchen',
          ingredients: [
            { name: 'Ripe Plantain', amount: '1 medium' },
            { name: 'Eggs', amount: '2' },
            { name: 'Vegetable Oil & Salt', amount: '2 tbsp' },
          ],
          steps: [
            'Slice ripe plantain into rounds and shallow-fry until golden.',
            'Beat eggs with a pinch of salt and diced pepper.',
            'Pour eggs into the skillet and fry gently until set.',
          ],
        },
        {
          id: `roll-${Date.now()}-morning-2`,
          title: 'Yam & Pepper Egg Sauce',
          subtitle: 'Tender boiled yam wedges with rich tomato egg sauce.',
          timeOfDay: 'morning',
          cookTimeMinutes: 15,
          estCost: 1.9,
          pantryNote: 'Uses yam & eggs from your pantry',
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
          id: `roll-${Date.now()}-morning-3`,
          title: 'Bread & Fried Egg',
          subtitle: 'Warm crusty bread with loose buttery eggs.',
          timeOfDay: 'morning',
          cookTimeMinutes: 8,
          estCost: 1.4,
          pantryNote: 'Uses bread & eggs',
          ingredients: [
            { name: 'Bread', amount: '2 slices' },
            { name: 'Eggs', amount: '2' },
            { name: 'Butter / Oil', amount: '1 tbsp' },
          ],
          steps: [
            'Toast bread in a skillet with butter until crisp.',
            'Fry eggs gently until whites are set and edges are crisp.',
            'Serve eggs hot tucked into crusty bread.',
          ],
        },
        {
          id: `roll-${Date.now()}-morning-4`,
          title: 'Toast & Hot Tea',
          subtitle: 'Buttery crisp toast with sweet comforting milk tea.',
          timeOfDay: 'morning',
          cookTimeMinutes: 5,
          estCost: 1.0,
          pantryNote: 'Uses bread, tea & milk',
          ingredients: [
            { name: 'Bread', amount: '2 slices' },
            { name: 'Tea & Milk', amount: '1 mug' },
            { name: 'Butter', amount: '1 tbsp' },
          ],
          steps: [
            'Boil water and brew rich black tea with evaporated milk.',
            'Toast bread slices golden and butter while piping hot.',
            'Dip warm toast into tea and enjoy.',
          ],
        },
      ],
      lunch: [
        {
          id: `roll-${Date.now()}-lunch-1`,
          title: 'Jollof Spaghetti',
          subtitle: 'Quick spiced pasta simmered in rich tomato stew.',
          timeOfDay: 'lunch',
          cookTimeMinutes: 15,
          estCost: 2.0,
          pantryNote: 'Uses pasta & tomato stew from your pantry',
          ingredients: [
            { name: 'Spaghetti', amount: '150g' },
            { name: 'Tomato Stew / Paste', amount: '2 tbsp' },
            { name: 'Onion & Seasoning', amount: '1 cube' },
          ],
          steps: [
            'Sauté chopped onion and tomato base in 1 tbsp oil.',
            'Add water and seasoning, bring to a boil.',
            'Snap spaghetti in half and simmer until sauce reduces and coats the pasta.',
          ],
        },
        {
          id: `roll-${Date.now()}-lunch-2`,
          title: 'Indomie & Fried Egg',
          subtitle: 'Noodles tossed with fried aromatics and a crispy fried egg.',
          timeOfDay: 'lunch',
          cookTimeMinutes: 8,
          estCost: 1.5,
          pantryNote: 'Uses noodles & egg',
          ingredients: [
            { name: 'Instant Noodles', amount: '1-2 packs' },
            { name: 'Egg', amount: '1-2' },
            { name: 'Tomato & Garlic', amount: '1 clove, 1 tomato' },
          ],
          steps: [
            'Sauté minced garlic and diced tomatoes in 1 tbsp cooking oil.',
            'Boil noodles in 1 cup water with seasoning until tender.',
            'Top with a fried egg with crispy edges and runny yolk.',
          ],
        },
        {
          id: `roll-${Date.now()}-lunch-3`,
          title: 'Garlic Rice & Egg',
          subtitle: 'Pan-toasted rice tossed in golden garlic butter.',
          timeOfDay: 'lunch',
          cookTimeMinutes: 12,
          estCost: 1.6,
          pantryNote: 'Uses leftover rice & garlic',
          ingredients: [
            { name: 'Cooked Rice', amount: '1.5 cups' },
            { name: 'Garlic & Butter', amount: '2 cloves, 1 tbsp' },
            { name: 'Egg', amount: '1' },
          ],
          steps: [
            'Melt butter in skillet, fry minced garlic until fragrant.',
            'Toss cold rice vigorously on high heat for 3 minutes.',
            'Slide a hot sunny-side egg on top.',
          ],
        },
        {
          id: `roll-${Date.now()}-lunch-4`,
          title: 'Chicken Suya Stir-Fry',
          subtitle: 'Tender chicken strips tossed with sweet onions and smoky suya spice.',
          timeOfDay: 'lunch',
          cookTimeMinutes: 14,
          estCost: 2.5,
          pantryNote: 'Uses chicken & onions',
          ingredients: [
            { name: 'Chicken Breast / Thighs', amount: '200g' },
            { name: 'Onions & Pepper', amount: '1 sliced' },
            { name: 'Suya Spice / Yaji', amount: '1 tbsp' },
          ],
          steps: [
            'Sear sliced chicken in hot oil until edges caramelize.',
            'Toss with thick onion wedges and suya spice for 3 minutes.',
            'Serve piping hot straight from skillet.',
          ],
        },
      ],
      dinner: [
        {
          id: `roll-${Date.now()}-dinner-1`,
          title: 'White Rice & Pepper Stew',
          subtitle: 'Steamed rice with savory tomato and pepper stew.',
          timeOfDay: 'dinner',
          cookTimeMinutes: 20,
          estCost: 2.2,
          pantryNote: 'Uses rice & pepper base from your kitchen',
          ingredients: [
            { name: 'Rice', amount: '1 cup' },
            { name: 'Tomato & Pepper Stew', amount: '1 cup' },
            { name: 'Hard Boiled Egg or Protein', amount: '1' },
          ],
          steps: [
            'Wash and steam rice with a pinch of salt until fluffy.',
            'Warm up pepper stew in a skillet.',
            'Ladle warm stew generously over hot white rice.',
          ],
        },
        {
          id: `roll-${Date.now()}-dinner-2`,
          title: 'One-Pot Jollof Rice',
          subtitle: 'Smoky, rich seasoned rice cooked in sweet tomato reduction.',
          timeOfDay: 'dinner',
          cookTimeMinutes: 25,
          estCost: 2.4,
          pantryNote: 'Uses rice, tomatoes & onions',
          ingredients: [
            { name: 'Rice', amount: '1.5 cups' },
            { name: 'Tomato Stew Base', amount: '1 cup' },
            { name: 'Thyme & Curry Powder', amount: '1 tsp each' },
          ],
          steps: [
            'Fry tomato base with curry, thyme, and bay leaf until thick and dark.',
            'Stir in washed rice with 1.5 cups water or broth.',
            'Cover tight with foil and lid; steam on low heat until grains tender.',
          ],
        },
        {
          id: `roll-${Date.now()}-dinner-3`,
          title: 'Ewa Aganyin & Soft Dodo',
          subtitle: 'Slow-simmered mashed beans with spicy charred palm oil sauce.',
          timeOfDay: 'dinner',
          cookTimeMinutes: 18,
          estCost: 2.0,
          pantryNote: 'Uses beans & plantains',
          ingredients: [
            { name: 'Cooked Beans', amount: '1.5 cups' },
            { name: 'Ripe Plantain', amount: '1' },
            { name: 'Aganyin Pepper Sauce', amount: '2 tbsp' },
          ],
          steps: [
            'Mash cooked beans lightly in a warm pot with a splash of water.',
            'Fry sweet plantain cubes until edges turn mahogany golden.',
            'Spoon dark caramelized aganyin pepper sauce over warm beans.',
          ],
        },
        {
          id: `roll-${Date.now()}-dinner-4`,
          title: 'Garlic Butter Chicken',
          subtitle: 'Seared chicken pieces cooked with sweet onions and aromatics.',
          timeOfDay: 'dinner',
          cookTimeMinutes: 18,
          estCost: 2.6,
          pantryNote: 'Uses chicken & aromatics',
          ingredients: [
            { name: 'Chicken', amount: '250g' },
            { name: 'Garlic & Onions', amount: '3 cloves, 1 onion' },
            { name: 'Cooking Oil & Spices', amount: '1 tbsp' },
          ],
          steps: [
            'Season chicken pieces with salt, bouillon, and black pepper.',
            'Sear in hot skillet undisturbed for 5 minutes until deeply golden.',
            'Toss with sliced onions and garlic; simmer covered until juicy.',
          ],
        },
        {
          id: `roll-${Date.now()}-dinner-5`,
          title: 'Garlic Butter Pasta',
          subtitle: 'Silky pasta tossed in sizzling garlic butter with herbs.',
          timeOfDay: 'dinner',
          cookTimeMinutes: 14,
          estCost: 1.8,
          pantryNote: 'Uses pasta & butter',
          ingredients: [
            { name: 'Rigatoni or Pasta', amount: '150g' },
            { name: 'Garlic & Butter', amount: '3 cloves, 2 tbsp' },
            { name: 'Black Pepper & Herbs', amount: '1 tsp' },
          ],
          steps: [
            'Boil pasta in salted water until al dente.',
            'Melt butter in skillet, gently cook garlic slices until golden.',
            'Toss drained pasta in garlic butter with pasta cooking water.',
          ],
        },
      ],
      late_night: [
        {
          id: `roll-${Date.now()}-latenight-1`,
          title: 'Indomie & Boiled Egg',
          subtitle: 'Spicy noodles with a tender egg.',
          timeOfDay: 'late_night',
          cookTimeMinutes: 7,
          estCost: 1.2,
          pantryNote: 'Uses instant noodles & egg from your pantry',
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
          id: `roll-${Date.now()}-latenight-2`,
          title: 'Cheddar & Sweet Onion Toastie',
          subtitle: 'Crispy buttered toast with melted cheese and warm onions.',
          timeOfDay: 'late_night',
          cookTimeMinutes: 6,
          estCost: 1.3,
          pantryNote: 'Uses bread & cheese',
          ingredients: [
            { name: 'Bread', amount: '2 slices' },
            { name: 'Cheddar / Cheese', amount: '50g' },
            { name: 'Butter', amount: '1 tbsp' },
          ],
          steps: [
            'Butter outside of bread slices.',
            'Layer cheese and sliced onions between bread.',
            'Pan-fry on low-medium until crust is deep golden and cheese flows.',
          ],
        },
        {
          id: `roll-${Date.now()}-latenight-3`,
          title: 'Hot Pepper Broth & Bread',
          subtitle: 'Spiced aromatic warm broth with crusty dipping bread.',
          timeOfDay: 'late_night',
          cookTimeMinutes: 8,
          estCost: 1.1,
          pantryNote: 'Uses pepper soup spice & bread',
          ingredients: [
            { name: 'Crusty Bread', amount: '2 slices' },
            { name: 'Pepper Soup Spice / Broth', amount: '1 cup' },
            { name: 'Onions', amount: '1/2 diced' },
          ],
          steps: [
            'Simmer broth with pepper soup spice and onions for 5 minutes.',
            'Pour into deep mug and serve steaming.',
            'Dip crusty bread into broth for instant warmth.',
          ],
        },
      ],
    };

    const list = fallbacksByPeriod[timeOfDay] || fallbacksByPeriod.dinner;
    const unpassed = list.filter((m) => !passedTitles.includes(m.title));
    const pool = unpassed.length > 0 ? unpassed : list;
    const fallback = pool[Math.floor(Math.random() * pool.length)];

    const systemPrompt = `You are Mama, an intuitive everyday kitchen companion.
You do NOT talk like an expensive restaurant. You speak like a real human home cook.
Suggest ONE single meal that matches the user's current moment.

RULES FOR DISH NAMES:
1. Always use real-life, everyday names that real humans say at home.
   Examples of GOOD names:
   - "Bread & Tea"
   - "Dodo & Fried Egg"
   - "Indomie & Boiled Egg"
   - "Jollof Rice"
   - "White Rice & Stew"
   - "Spaghetti & Corned Beef"
   - "Beans & Plantain"
   - "Yam & Egg Sauce"
   - "Toast & Fried Egg"
   - "Oatmeal with Milk"
   - "Eba & Egusi"
   - "Fried Rice with Chicken"
2. NEVER use buzzwords in the title like "Sizzle", "Skillet", "Bowl", "Frittata", "Hash", "Loaded", "medallions", "artisan", "bed of greens", "curds", "sun-kissed", or "deconstructed". Keep titles between 2 and 5 words, humble, simple, and relatable.
3. Time of day requirements:
   - morning: Fast breakfast, under 12 minutes (eggs, bread, tea, oatmeal, plantain).
   - lunch: Substantial midday fuel, under 20 minutes (pasta, noodles, rice, quick sauces).
   - dinner: Comforting, proper evening meal.
   - late_night: Low-effort, under 10 minutes (noodles, tea & toast, egg plate).
4. Learning and Adaptation:
   ${passedTitles.length > 0 ? `- The user recently PASSED on: ${passedTitles.join(', ')}. DO NOT suggest any of these, and shift to a different flavor/base.` : ''}
   ${recentCookedTitles.length > 0 ? `- The user loved and COOKED: ${recentCookedTitles.join(', ')}. Use this style as inspiration.` : ''}
5. Kitchen Pantry:
   ${pantryItems.length > 0 ? `- Available in their kitchen: ${pantryItems.join(', ')}. Actively use these ingredients. In "pantryNote", state briefly what from their kitchen is used.` : '- Suggest standard household pantry staples.'}
${bodyGoal === 'curves_glutes' ? '6. Body Goal (Curves & Glutes): Prioritize dishes with rich protein (eggs, chicken, fish, beans) and complex slow carbs (plantains, yam, oats) for healthy body nourishment.' : ''}
${bodyGoal === 'reduce_weight' ? '6. Body Goal (Lean & Light): Prioritize light, high-protein meals with fresh greens, vegetables, or light pepper broths with minimal heavy oils.' : ''}
${bodyGoal === 'add_weight' ? '6. Body Goal (Healthy Weight & Bulk): Prioritize calorie-dense wholesome staples (yam, rice, beans, plantains, comforting stews).' : ''}
${pass?.dietaryRestrictions && pass.dietaryRestrictions.length > 0 ? `7. STRICT DIETARY RESTRICTIONS: ${pass.dietaryRestrictions.join(', ')}. NEVER include forbidden ingredients.` : ''}

Cultural context: ${cuisine}
Available gear: ${gear}
Max cook time: ${maxTime} minutes

Output strictly JSON:
{
  "id": string,
  "title": string,
  "subtitle": string,
  "timeOfDay": "morning" | "lunch" | "dinner" | "late_night",
  "cookTimeMinutes": number,
  "estCost": number (base cost in USD between 1.0 and 3.5, e.g. 1.8. Never output local currencies or numbers greater than 5),
  "pantryNote": string,
  "mamaTip": string,
  "ingredients": [{ "name": string, "amount": string }],
  "steps": string[]
}`;

    const userPrompt = `Roll one everyday meal for ${timeOfDay}. Current pantry: ${pantryItems.join(', ') || 'basic staples'}.`;

    const result = await this.executeStructuredPrompt<RolledMeal>(systemPrompt, userPrompt, fallback);
    if (result && typeof result.estCost === 'number' && result.estCost > 50) {
      result.estCost = Math.max(1.0, Math.min(4.0, Number((result.estCost / 1400).toFixed(2))));
    }
    return result;
  }
}
