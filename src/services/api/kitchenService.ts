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
   * Fetch today's curated daily edit recommendations from Groq
   */
  async fetchDailyEdit(pantryItems: string[] = ['Eggs', 'Tomatoes', 'Rice']): Promise<GeneratedDailyEdit> {
    try {
      return await apiClient<GeneratedDailyEdit>('/api/daily-edit', {
        method: 'POST',
        body: JSON.stringify({ pantryItems }),
      });
    } catch {
      // Offline fallback
      return {
        curatorNote: "Crisp evening. Let's make something comforting with the eggs and rice in your kitchen.",
        makeNowMeal: {
          id: 'make-now-1',
          title: 'Warm Ginger & Scallion Fried Rice',
          timeMinutes: 14,
          ingredientsCount: 5,
          description: 'Fragrant crisp rice folded with whipped eggs and sizzled scallions.',
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
          tags: ['Pantry Friendly', 'One-Pan'],
        },
        tonightDinner: {
          id: 'tonight-1',
          title: 'Silky Tomato Egg Rice Bowl',
          timeMinutes: 18,
          description: 'Slow-simmered vine tomatoes melted into soft curds over hot short-grain rice.',
          imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        },
        eatingOutRecommendation: {
          spotName: 'Koyo Ramen & Izakaya',
          dishName: 'Smoked Garlic Paitan',
          distance: '0.6 mi away',
          price: '$$',
          vibe: 'Warm timber counter, quiet jazz',
        },
      };
    }
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
