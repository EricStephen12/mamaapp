import { apiClient } from './client';

export interface PantryAnalysis {
  freshProduce: string[];
  proteins: string[];
  pantryStaples: string[];
  seasonings: string[];
  suggestedPairs: string[];
}

export interface GeneratedDailyEdit {
  curatorNote: string;
  makeNowMeal: {
    id: string;
    title: string;
    timeMinutes: number;
    ingredientsCount: number;
    description: string;
    imageUrl?: string;
    imagePrompt?: string;
    tags: string[];
  };
  tonightDinner: {
    id: string;
    title: string;
    timeMinutes: number;
    description: string;
    imageUrl?: string;
  };
  eatingOutRecommendation: {
    spotName: string;
    dishName: string;
    distance: string;
    price: string;
    vibe: string;
  };
}

export interface GeneratedRecipePayload {
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
  imageUrl?: string;
}

export const kitchenService = {
  /**
   * Fetch today's curated daily edit recommendations from Groq AI.
   * Throws on failure — callers should handle the error state themselves.
   */
  async fetchDailyEdit(pantryItems: string[]): Promise<GeneratedDailyEdit> {
    return apiClient<GeneratedDailyEdit>('/api/daily-edit', {
      method: 'POST',
      body: JSON.stringify({ pantryItems }),
    });
  },

  /**
   * Analyze raw detected or entered pantry items
   */
  async analyzePantry(items: string[]): Promise<PantryAnalysis> {
    return apiClient<PantryAnalysis>('/api/kitchen/analyze', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  /**
   * Generate a custom recipe based on pantry items
   */
  async generateRecipe(availableIngredients: string[], titleSuggestion?: string): Promise<GeneratedRecipePayload> {
    return apiClient<GeneratedRecipePayload>('/api/recipes/generate', {
      method: 'POST',
      body: JSON.stringify({ availableIngredients, titleSuggestion }),
    });
  },
};
