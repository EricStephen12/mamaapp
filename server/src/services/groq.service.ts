import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY || '';

const groqClient = groqApiKey
  ? new Groq({ apiKey: groqApiKey })
  : null;

// 120B model on Groq gives peak culinary intelligence and structured JSON adherence
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

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

export class GroqService {
  /**
   * Helper to execute a structured JSON prompt with Groq
   */
  private static async executeStructuredPrompt<T>(systemPrompt: string, userPrompt: string, fallback: T): Promise<T> {
    if (!groqClient) {
      console.warn('[GroqService] No GROQ_API_KEY provided in .env — returning sensible fallback data.');
      return fallback;
    }

    try {
      const completion = await groqClient.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_completion_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return fallback;

      return JSON.parse(content) as T;
    } catch (error) {
      console.error('[GroqService] Error executing Groq prompt:', error);
      return fallback;
    }
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
            title: 'Sizzled Pepper Eggs & Golden Plantains',
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
            title: 'Smoky Tomato & Pepper Egg Skillet Rice',
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
            title: 'Crispy Garlic Fried Egg Rice',
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
            title: 'Sweet Soy & Ginger Scallion Noodles',
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
            title: 'Melted Cheddar & Herb Soft Scramble',
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
            title: 'Garlic Butter & Parmesan Skillet Pasta',
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
}
