/**
 * Mama Dialogue Engine
 * Provides culturally grounded, maternal, contextually synced voice lines
 * for Mama across every interaction in the Mama Kitchen app.
 *
 * Mama knows:
 * 1. The child's pantry ingredients.
 * 2. The child's weekly budget balance and recent spend.
 * 3. The time of day and energy level.
 * 4. The available cooking gear and time constraints.
 * 5. Dietary restrictions and allergies (strictly respected).
 * 6. Previous meal passes / re-rolls in the session.
 */

import { UserKitchenPass } from './preferencesStore';
import { MamaPose } from '../components/common/MamaCharacter';

export type MealPeriod = 'morning' | 'lunch' | 'dinner' | 'late_night';

export interface MamaSyncContext {
  timeOfDay: MealPeriod;
  pass: UserKitchenPass;
  pantryItems?: string[];
  activeDish?: {
    title: string;
    cookTimeMinutes?: number;
    estCost?: number;
    gear?: string;
    ingredients?: { name: string; amount: string }[];
    mamaTip?: string;
  };
  actionHint?: 'init' | 'pass_meal' | 'tap_advice' | 'pantry_review' | 'discover_feed' | 'cook_start';
  lastPassedDishTitle?: string;
}

export const MAMA_COUNTRY_LINES: Record<string, string[]> = {
  NG: [
    "You worked hard today, my child. Take off your shoes, let Mama sort out your dinner.",
    "Pepper cures tiredness! Just a little ata rodo and sweet onion in the pan.",
    "No dirty pots in this house! One skillet, crisp the garlic, and eat straight from the bowl.",
    "Good home food is medicine for a long day. Sit down and let's eat.",
  ],
  GB: [
    "London weather got you cold? A hot sizzled skillet will warm your hands right up.",
    "Put the kettle on, my dear. We'll make something ten times better than a cold meal deal.",
    "No need to spend on food delivery tonight. We'll make this fresh in minutes.",
    "Work was stressful today? A warm home-cooked meal will help you switch off properly.",
  ],
  US: [
    "Skip the delivery wait and delivery fees tonight. In 10 minutes you'll be eating warm in your sweatpants.",
    "Simple food, big flavor. We're here to relax tonight, not wash a mountain of dishes.",
    "You saved money and cooked clean tonight. Mama is proud of you, my child!",
  ],
  GH: [
    "Akwaaba, my child! Take a breath, relax your mind. Good warm food is waiting for you.",
    "Rich aroma and golden crisp edges cure any tired soul tonight.",
    "Dinner doesn't need to be complicated. Simple, fresh, and straight from the pan.",
  ],
  KE: [
    "Karibu, my child! A hot pan with sweet onions and tomatoes will set your evening right.",
    "You worked hard today. Eat warm food and rest well tonight.",
    "Simple home comfort is always best. Let's make something satisfying.",
  ],
  EU: [
    "Good olive oil, sweet onions, and a hot pan. Effortless luxury without dirty pots.",
    "Relax, my dear. Pour a glass of water, breathe, and let's eat well tonight.",
    "Simple ingredients treated with love make the finest dinner.",
  ],
  CA: [
    "Cold evening outside? We'll make a hot, hearty 1-pan feast in under 12 minutes.",
    "Warm, golden, and satisfying. Pure cozy comfort for tonight.",
  ],
};

export const MAMA_TIME_LINES: Record<MealPeriod, string[]> = {
  morning: [
    "Good morning, my child! Don't leave the house on an empty stomach.",
    "A hot pan and 5 minutes, and your body is ready for the day ahead.",
    "Start your day with real food, not just coffee. Mama wants you strong!",
  ],
  lunch: [
    "Step away from your laptop screen! Your body needs real food, not just coffee.",
    "Take a proper pause for lunch. Don't rush your food!",
    "A quick warm bite now will keep your energy high all afternoon.",
  ],
  dinner: [
    "Look at you, worked all day. Dinner should be comforting and zero hassle.",
    "The workday is officially done. Now comes the best part of your evening.",
    "One pan only. In this kitchen, we don't scrub pots when we're exhausted.",
    "A warm hot bowl and your favorite playlist. You earned this tonight, my child.",
  ],
  late_night: [
    "Late night hunger is real! Mama won't judge. Let's make something light and fast.",
    "Keep it gentle and warm so you can sleep like a baby tonight.",
    "Just a quick 5-minute plate, then off to bed with you.",
  ],
};

export const MAMA_PASS_LINES = [
  "Not feeling this one? No problem, my child! Mama has plenty of tricks in her recipe book.",
  "Too heavy for tonight? Let me show you something lighter and faster.",
  "Passed! Look at this next option, pure comfort.",
  "I'm listening, my dear. Mama learns what your stomach actually craves.",
  "On to the next plate. Zero pressure in this kitchen!",
];

export const MAMA_COOK_LINES = [
  "Now you're talking! Put the pan on medium heat, let's get you eating.",
  "Yes! High flavor, zero dishes. You're going to sleep very happy tonight.",
  "That's my child! In a few minutes, dinner is on the table.",
  "Delicious choice! Follow my simple steps and enjoy every bite.",
];

export class MamaDialogueService {
  /**
   * Fully synchronized Mama voice synthesizer.
   * Directly considers: pantry, budget, time, gear, diet, and recent actions.
   */
  static getSyncedMamaVoice(context: MamaSyncContext): { quote: string; pose: MamaPose } {
    const { pass, timeOfDay, pantryItems = [], activeDish, actionHint = 'init', lastPassedDishTitle } = context;

    const remainingBudget = pass.weeklyBudget - pass.spentThisWeek;
    const isBudgetTight = remainingBudget <= 0 || (pass.weeklyBudget > 0 && remainingBudget / pass.weeklyBudget < 0.2);
    const isBudgetHealthy = pass.weeklyBudget > 0 && remainingBudget / pass.weeklyBudget >= 0.5;

    const dishTitle = activeDish?.title || '';
    const cookMinutes = activeDish?.cookTimeMinutes || pass.timeLimitMinutes || 12;
    const gearLabel = activeDish?.gear || pass.cookingGearLabel || '1 pan';

    // 1. REACTION TO PASSING / SKIPPING A MEAL
    if (actionHint === 'pass_meal' && lastPassedDishTitle) {
      if (dishTitle) {
        return {
          quote: `No problem! How about ${dishTitle} in ${cookMinutes} mins?`,
          pose: 'cooking',
        };
      }
      return {
        quote: `No problem, let me find another quick meal for you.`,
        pose: 'writing',
      };
    }

    // 2. TAPPING MAMA FOR CULINARY ADVICE (Contextual dish tip or budget check)
    if (actionHint === 'tap_advice') {
      if (activeDish?.mamaTip && activeDish.mamaTip.length > 10) {
        return {
          quote: activeDish.mamaTip,
          pose: 'cooking',
        };
      }

      if (dishTitle) {
        // Goal-aware motherly nutritionist wisdom
        if (pass.bodyGoal === 'curves_glutes') {
          return {
            quote: `Mama made sure ${dishTitle} fuels your curves! Real wholesome protein and slow carbs build natural strength and fullness.`,
            pose: 'delighted',
          };
        }
        if (pass.bodyGoal === 'reduce_weight') {
          return {
            quote: `Mama picked ${dishTitle} to keep you lean and light! High in flavor, gentle on oil, and easy on your body tonight.`,
            pose: 'cooking',
          };
        }
        if (pass.bodyGoal === 'add_weight') {
          return {
            quote: `Eat with joy, my child! ${dishTitle} gives your body healthy, calorie-dense sustenance to build good weight and stamina.`,
            pose: 'welcoming',
          };
        }

        // Specific dish cooking wisdom
        const lower = dishTitle.toLowerCase();
        if (lower.includes('plantain') || lower.includes('dodo')) {
          return {
            quote: "Cut the plantains into thick golden coins and let them caramelize dark and sweet over medium heat.",
            pose: 'cooking',
          };
        }
        if (lower.includes('jollof') || lower.includes('pasta') || lower.includes('spag')) {
          return {
            quote: "Snap the pasta or rice right into that seasoned sauce so it absorbs every drop of aroma in 1 pan.",
            pose: 'cooking',
          };
        }
        if (lower.includes('egg') || lower.includes('scramble')) {
          return {
            quote: "Keep your heat gentle for eggs; velvety curds make a simple dinner feel like luxury.",
            pose: 'cooking',
          };
        }
        if (lower.includes('noodle') || lower.includes('indomie')) {
          return {
            quote: "Leave just a spoonful of cooking broth in the pan before tossing so the flavors stay rich and silky.",
            pose: 'cooking',
          };
        }

        // Check if dish ingredients match pantry
        if (pantryItems.length > 0) {
          const matched = pantryItems.find((p) => lower.includes(p.toLowerCase()));
          if (matched) {
            return {
              quote: `We've got ${matched} in your kitchen right now! In ${cookMinutes} minutes with your ${gearLabel}, you will be eating like royalty.`,
              pose: 'delighted',
            };
          }
        }

        // Budget-sensitive advice
        if (isBudgetTight) {
          return {
            quote: `We're watching our weekly balance (${pass.currencySymbol}${Math.max(0, Math.round(remainingBudget))} left), so ${dishTitle} is perfect: minimal cost, maximum comfort.`,
            pose: 'writing',
          };
        }

        return {
          quote: `Heat your ${gearLabel} well before cooking ${dishTitle}. Good heat seals in all the flavor!`,
          pose: 'cooking',
        };
      }
    }

    // 3. PANTRY REVIEW / WHAT'S IN YOUR KITCHEN
    if (actionHint === 'pantry_review') {
      return this.getPantryReaction(pantryItems.length, pantryItems, pass);
    }

    // 4. DISCOVER FEED REACTION
    if (actionHint === 'discover_feed') {
      if (isBudgetTight) {
        return {
          quote: `We have ${pass.currencySymbol}${Math.max(0, Math.round(remainingBudget))} left this week, my dear. Mama picked meals that keep your wallet happy.`,
          pose: 'writing',
        };
      }
      return {
        quote: `Swipe right on whatever makes your mouth water! Mama saves your favorites and learns your taste.`,
        pose: 'welcoming',
      };
    }

    // 5. COOK START / RECIPE DETAILS VIEW
    if (actionHint === 'cook_start') {
      if (activeDish?.mamaTip && activeDish.mamaTip.length > 5) {
        return {
          quote: activeDish.mamaTip,
          pose: 'cooking',
        };
      }
      if (dishTitle) {
        return {
          quote: `Heat your ${gearLabel} gently. Take your time with ${dishTitle}, and let every aroma come alive.`,
          pose: 'cooking',
        };
      }
      return {
        quote: `Follow my simple steps, and you'll be eating warm and happy in no time!`,
        pose: 'cooking',
      };
    }

    // 5. ACTIVE DISH ON HOME FEED (DEFAULT)
    if (dishTitle) {
      // If we have active dish tip, prioritize it
      if (activeDish?.mamaTip) {
        return {
          quote: activeDish.mamaTip,
          pose: 'cooking',
        };
      }

      // Check for direct match with user's pantry
      if (pantryItems.length > 0) {
        const lowerDish = dishTitle.toLowerCase();
        const matched = pantryItems.filter((item) => lowerDish.includes(item.toLowerCase()));
        if (matched.length > 0) {
          return {
            quote: `We have ${matched.slice(0, 2).join(' and ')} in your kitchen right now! Let's make ${dishTitle} in ${cookMinutes} minutes.`,
            pose: 'delighted',
          };
        }
      }

      // Budget celebration if healthy
      if (isBudgetHealthy && remainingBudget >= 20) {
        return {
          quote: `Let's make ${dishTitle} tonight — warm, fast, and within budget.`,
          pose: 'delighted',
        };
      }

      // Goal-aware motherly nutritionist voice
      if (pass.bodyGoal === 'curves_glutes') {
        return {
          quote: `Eat well, my child — ${dishTitle} has good wholesome protein and slow carbs for your curves today.`,
          pose: 'welcoming',
        };
      }
      if (pass.bodyGoal === 'reduce_weight') {
        return {
          quote: `I picked ${dishTitle} to keep things light, wholesome, and easy on your body today.`,
          pose: 'cooking',
        };
      }
      if (pass.bodyGoal === 'add_weight') {
        return {
          quote: `Finish your plate of ${dishTitle}, my child! Real hearty food to build strength on your body.`,
          pose: 'welcoming',
        };
      }

      // Time-of-day contextual dish introduction
      if (timeOfDay === 'morning') {
        return {
          quote: `Good morning, my child! A warm plate of ${dishTitle} will start your day right.`,
          pose: 'welcoming',
        };
      }
      if (timeOfDay === 'lunch') {
        return {
          quote: `Time to pause and eat, my child. ${dishTitle} is fresh and nourishing.`,
          pose: 'cooking',
        };
      }
      if (timeOfDay === 'late_night') {
        return {
          quote: `Late night hunger? ${dishTitle} is gentle on your stomach tonight, my child.`,
          pose: 'welcoming',
        };
      }

      return {
        quote: `Tonight's plate is ${dishTitle} — wholesome, warm, and ready in minutes.`,
        pose: 'cooking',
      };
    }

    // 6. GENERAL GREETING (Empty dish state fallback)
    const countryLines = MAMA_COUNTRY_LINES[pass.country] || MAMA_COUNTRY_LINES.NG;
    const timeLines = MAMA_TIME_LINES[timeOfDay] || MAMA_TIME_LINES.dinner;
    const pool = [...countryLines, ...timeLines];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return {
      quote: pool[randomIndex],
      pose: 'welcoming',
    };
  }

  /**
   * Backwards compatible dynamic quote helper
   */
  static getDynamicQuote(
    period: MealPeriod,
    pass: UserKitchenPass,
    activeDishTitle?: string,
    pantryItems: string[] = []
  ): string {
    const result = this.getSyncedMamaVoice({
      timeOfDay: period,
      pass,
      pantryItems,
      activeDish: activeDishTitle ? { title: activeDishTitle } : undefined,
      actionHint: 'init',
    });
    return result.quote;
  }

  /**
   * Interactive voice line when tapping Mama
   */
  static getRandomInteractiveLine(pass: UserKitchenPass): { quote: string; pose: MamaPose } {
    const remainingBudget = pass.weeklyBudget - pass.spentThisWeek;
    if (pass.weeklyBudget > 0) {
      if (remainingBudget > 0) {
        return {
          quote: `I'm keeping track of your budget: ${pass.currencySymbol}${Math.round(remainingBudget)} remaining this week. You're doing so well, my child!`,
          pose: 'writing',
        };
      }
    }
    const countryLines = MAMA_COUNTRY_LINES[pass.country] || MAMA_COUNTRY_LINES.NG;
    const pick = countryLines[Math.floor(Math.random() * countryLines.length)];
    return {
      quote: pick,
      pose: 'cooking',
    };
  }

  /**
   * Reaction when user passes / rolls again
   */
  static getPassReaction(lastPassedTitle?: string): string {
    if (lastPassedTitle) {
      return `Not feeling ${lastPassedTitle}? Mama has another quick, comforting idea for you.`;
    }
    return MAMA_PASS_LINES[Math.floor(Math.random() * MAMA_PASS_LINES.length)];
  }

  /**
   * Reaction when user cooks a meal
   */
  static getCookReaction(): string {
    return MAMA_COOK_LINES[Math.floor(Math.random() * MAMA_COOK_LINES.length)];
  }

  /**
   * Discover screen greeting
   */
  static getDiscoverQuote(pass: UserKitchenPass, remainingBudget?: number): string {
    const budgetVal = remainingBudget ?? (pass.weeklyBudget - pass.spentThisWeek);
    if (budgetVal <= 0) {
      return `We're keeping things low cost tonight. Browse dishes that make the most of what we have!`;
    }
    return `Swipe right to save to your kitchen pass, left to pass. Mama notes every flavor you love!`;
  }

  /**
   * Reaction to Discover filter toggle
   */
  static getDiscoverFilterReaction(filter: 'all' | 'home' | 'eating_out'): string {
    if (filter === 'home') {
      return "Cooking at home! Low cost, zero fuss, clean food.";
    }
    if (filter === 'eating_out') {
      return "Treating yourself tonight? Mama picked spots within your weekly budget.";
    }
    return "All options on the table. Follow your appetite, my child!";
  }

  /**
   * Synced voice line for the Kitchen & Pantry screen
   */
  static getPantryReaction(
    itemCount: number,
    items: string[],
    pass: UserKitchenPass
  ): { quote: string; pose: MamaPose } {
    if (itemCount === 0) {
      return {
        quote: "Your kitchen is looking bare, my child! Tap ingredients below or scan what you have so Mama can suggest tonight's dinner.",
        pose: 'welcoming',
      };
    }
    if (itemCount <= 2) {
      return {
        quote: `We've got ${items.join(' and ')} in the kitchen! Even with just these, we can make something warm and comforting.`,
        pose: 'cooking',
      };
    }
    if (itemCount <= 4) {
      return {
        quote: `I see ${items.slice(0, 3).join(', ')} and more in your kitchen! In under ${pass.timeLimitMinutes || 15} minutes, dinner is sorted.`,
        pose: 'delighted',
      };
    }
    return {
      quote: `Your kitchen is stocked with ${itemCount} good items! We have plenty of delicious possibilities tonight.`,
      pose: 'delighted',
    };
  }
}
