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
    timeMinutes: number;
    ingredientsCount: number;
    description: string;
    imagePrompt: string;
    tags: string[];
  };
  tonightDinner: {
    id: string;
    title: string;
    timeMinutes: number;
    description: string;
    imagePrompt: string;
  };
  eatingOutRecommendation: {
    spotName: string;
    dishName: string;
    distance: string;
    price: string;
    vibe: string;
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
   */
  static async generateDailyEdit(
    pantryItems: string[],
    pass?: {
      cuisineAnchor?: string;
      cookingGear?: string;
      timeLimitMinutes?: number;
      spiceLevel?: string;
    }
  ): Promise<DailyEditPayload> {
    const cuisine = pass?.cuisineAnchor || 'African & Caribbean comfort';
    const gear = pass?.cookingGear || '1 pan on a single burner';
    const maxTime = pass?.timeLimitMinutes || 12;
    const spice = pass?.spiceLevel || 'warm kick';

    const fallback: DailyEditPayload = {
      curatorNote: "Long day? Don't stress. A warm 1-pan dinner with eggs and rice will set you right.",
      makeNowMeal: {
        id: 'make-now-1',
        title: 'Sizzled Pepper Egg & Onion Rice',
        timeMinutes: 9,
        ingredientsCount: 4,
        description: 'Crisped eggs folded into warm rice with fragrant caramelized onions and gentle chili warmth.',
        imagePrompt: 'Top-down editorial culinary photograph of golden crispy fried eggs and caramelized onions over steamed rice in a shallow earthenware bowl, natural warm lighting, cinematic food photography.',
        tags: ['1-Pan', '9 Minutes', 'Comfort'],
      },
      tonightDinner: {
        id: 'tonight-1',
        title: 'Spiced Tomato & Pepper Egg Skillet',
        timeMinutes: 12,
        description: 'Rich slow-simmered tomato and pepper sauce with velvety eggs, perfect for dipping warm crusty bread.',
        imagePrompt: 'Close up editorial photograph of savory red tomato and bell pepper stew with soft poached eggs in a cast iron skillet, chopped parsley, warm rustic bread on the side.',
      },
      eatingOutRecommendation: {
        spotName: 'Koyo Izakaya & Bowls',
        dishName: 'Smoked Garlic Paitan Ramen',
        distance: '0.4 mi away',
        price: '$$',
        vibe: 'Warm timber counter, zero wait',
      },
    };

    const systemPrompt = `You are Mama's head culinary editor.
Generate today's curated daily edit for an exhausted bachelor/worker.
Strict constraints:
- User's cultural palate: ${cuisine}
- Available cooking gear: ${gear} (NEVER suggest oven if 1-pan)
- Hard cook time limit: under ${maxTime} minutes!
- Spice level: ${spice}
- Max ingredients: 3-5 pantry staples
Tone: Warm, calm, reassuring, zero robotic jargon.
Include:
1. curatorNote (1 short reassuring sentence)
2. makeNowMeal (fastest comfort meal under ${maxTime} min, 1 pan)
3. tonightDinner (satisfying alternative)
4. eatingOutRecommendation (nearby calm comfort spot when too exhausted to cook)
Output strictly as JSON matching:
{
  "curatorNote": string,
  "makeNowMeal": { "id": string, "title": string, "timeMinutes": number, "ingredientsCount": number, "description": string, "imagePrompt": string, "tags": string[] },
  "tonightDinner": { "id": string, "title": string, "timeMinutes": number, "description": string, "imagePrompt": string },
  "eatingOutRecommendation": { "spotName": string, "dishName": string, "distance": string, "price": string, "vibe": string }
}`;

    const userPrompt = `Pantry items available: ${pantryItems.join(', ')}.`;

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
