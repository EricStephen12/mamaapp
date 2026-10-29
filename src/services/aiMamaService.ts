/**
 * AI Mama Live Intelligence Service
 * Powered directly by Groq ultra-low-latency LLM inference.
 * Generates culturally tailored real-time dialogue and custom pantry recipes.
 */

import { UserKitchenPass } from './preferencesStore';
import { MamaDialogueService } from './mamaDialogueService';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';

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

export class AiMamaService {
  /**
   * Request dynamic voice line for Mama from Groq tailored to user's live culinary context
   */
  static async getLiveMamaDialogue(
    pass: UserKitchenPass,
    contextHint: 'greeting' | 'tap' | 'discover' | 'cooking' | 'pantry' = 'tap'
  ): Promise<string> {
    try {
      const systemPrompt = `You are "Mama", a warm, wise, loving home-cook mother figure in the "Mama Kitchen" app.
Your tone:
- Deeply caring, grounded, practical, and culturally authentic.
- You speak affectionately to your child ("my child", "my dear").
- User is located in: ${pass.countryName} (Currency: ${pass.currencySymbol}).
- User prefers: ${pass.cuisineLabel}.
- Available gear: ${pass.cookingGearLabel}.
- Max time: ${pass.timeLimitLabel}.
- Spice preference: ${pass.spiceLabel}.
- Keep replies to ONE concise, comforting sentence (max 25 words).
- Zero robotic filler, zero corporate buzzwords.`;

      const userPrompts = {
        greeting: `Give me a warm greeting for today and remind me that dinner doesn't have to be complicated.`,
        tap: `Say something encouraging and practical about tonight's dinner in our kitchen.`,
        discover: `Give me a quick culinary nudge on finding something delicious and fast to eat tonight.`,
        cooking: `Give me a secret kitchen trick for cooking in 1 pan with zero sticky mess.`,
        pantry: `Reassure me that with simple pantry staples like eggs, onions, and rice, we can eat like kings.`,
      };

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompts[contextHint] || userPrompts.tap },
          ],
          temperature: 0.7,
          max_tokens: 60,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq HTTP ${response.status}`);
      }

      const data = await response.json();
      const quote = data.choices?.[0]?.message?.content?.trim();
      if (quote) {
        // Strip enclosing quotes if model returned them
        return quote.replace(/^["']|["']$/g, '');
      }
    } catch {
      // Quiet fallback to instant cultural line
    }

    // Fallback to instant local dialogue
    if (contextHint === 'discover') {
      return MamaDialogueService.getDiscoverQuote(pass);
    }
    return MamaDialogueService.getRandomInteractiveLine(pass).quote;
  }

  /**
   * Generate an authentic, tailored 1-pan recipe based on scanned or selected pantry items
   */
  static async generateRecipeFromPantry(
    pantryItems: string[],
    pass: UserKitchenPass
  ): Promise<AIRecipeResult> {
    const fallback: AIRecipeResult = {
      title: 'Sizzled Pepper Egg & Onion Scramble',
      subtitle: 'Velvety eggs with caramelized onions and golden pepper curds.',
      cookTime: '8 min',
      gear: '1 Skillet',
      estCost: `${pass.currencySymbol}${pass.country === 'NG' ? '2,200' : '2.50'}`,
      steps: [
        'Slice onions and sweet peppers thinly; heat oil in skillet until hot.',
        'Fry aromatics for 3 minutes until sweet and golden.',
        'Whisk eggs with a pinch of salt; gently fold into loose curds in the same pan.',
        'Plate hot and serve immediately.',
      ],
      ingredients: [
        { name: 'Fresh Eggs', amount: '2-3 eggs' },
        { name: 'Sweet Onion & Pepper', amount: '1 small' },
        { name: 'Cooking Oil or Butter', amount: '1 tbsp' },
        { name: 'Salt & Black Pepper', amount: 'To taste' },
      ],
      chefTip: 'Never wash 5 pots when 1 skillet can do the entire feast!',
    };

    try {
      const systemPrompt = `You are Mama's head culinary intelligence.
Generate a realistic, fast, comforting home recipe using the user's pantry items.
Constraints:
- User Country: ${pass.countryName}
- Cuisine anchor: ${pass.cuisineLabel}
- Gear: 1 pan / skillet only
- Max cook time: 12 minutes
- Strictly return valid JSON matching this schema:
{
  "title": string,
  "subtitle": string,
  "cookTime": string,
  "gear": "1 Skillet",
  "estCost": string,
  "steps": string[],
  "ingredients": [ { "name": string, "amount": string } ],
  "chefTip": string
}`;

      const userPrompt = `Pantry items on hand: ${pantryItems.join(', ')}. Local currency: ${pass.currencySymbol}.`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content) as AIRecipeResult;
        if (parsed.title && Array.isArray(parsed.steps)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return fallback;
  }
}
