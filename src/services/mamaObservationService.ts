/**
 * Mama Observation Service
 * Makes Mama's real-time pattern learning visible and trustworthy.
 *
 * Discovers patterns across:
 * - Protein/ingredient skips (e.g. "Mama noticed you skip fish")
 * - Speed preferences (e.g. "Mama noticed you prefer meals under 15 minutes")
 * - Staple preferences (e.g. "Mama noticed you love plantains")
 * - Budget awareness & session roll patterns
 */

import { UserKitchenPass } from './preferencesStore';
import { MealDecisionItem } from './api/decisionsService';

export interface MamaObservation {
  title: string;
  detail: string;
  iconName: 'bulb-outline' | 'heart-outline' | 'time-outline' | 'wallet-outline' | 'restaurant-outline';
  tag: string;
}

export class MamaObservationService {
  /**
   * Generates a timely, authentic learning observation for the active session.
   */
  static getActiveObservation(params: {
    pass: UserKitchenPass;
    sessionPassedTitles: string[];
    recentDecisions?: MealDecisionItem[];
    activeDishTitle?: string;
  }): MamaObservation | null {
    const { pass, sessionPassedTitles, recentDecisions = [], activeDishTitle } = params;

    // 1. Check for permanently hidden / "never show" dishes
    if (pass.neverShowDishes && pass.neverShowDishes.length > 0) {
      const lastHidden = pass.neverShowDishes[pass.neverShowDishes.length - 1];
      return {
        title: 'Mama remembered',
        detail: `Never suggesting ${lastHidden}. Removed from all future dinner rolls.`,
        iconName: 'bulb-outline',
        tag: 'Custom exclusion',
      };
    }

    // 2. Pattern detection over recent decisions + session passes
    const allPassedTitles = [
      ...sessionPassedTitles,
      ...recentDecisions.filter((d) => d.action === 'passed').map((d) => d.dishTitle),
    ].map((t) => t.toLowerCase());

    // Ingredient pass counters
    const countPassed = (terms: string[]) =>
      allPassedTitles.filter((title) => terms.some((term) => title.includes(term))).length;

    const fishSkips = countPassed(['fish', 'tuna', 'sardine', 'salmon', 'shrimp']);
    const meatSkips = countPassed(['beef', 'suya', 'steak', 'gizzard', 'sausage']);
    const riceSkips = countPassed(['rice', 'jollof']);
    const pastaSkips = countPassed(['pasta', 'spaghetti', 'noodles', 'indomie', 'macaroni']);

    if (fishSkips >= 2) {
      return {
        title: 'Mama noticed you skip fish',
        detail: 'Keeping dinner suggestions focused on chicken, eggs, and hearty pantry staples.',
        iconName: 'bulb-outline',
        tag: 'Learned preference',
      };
    }

    if (meatSkips >= 3) {
      return {
        title: 'Mama noticed you prefer lighter meals',
        detail: 'Steering away from heavy meats toward comforting egg, bean, and vegetable dishes.',
        iconName: 'bulb-outline',
        tag: 'Learned preference',
      };
    }

    if (riceSkips >= 2) {
      return {
        title: "Mama noticed you're passing rice",
        detail: 'Switching up the base tonight with golden yam, pasta, and warm bread.',
        iconName: 'restaurant-outline',
        tag: 'Variety rotation',
      };
    }

    if (pastaSkips >= 2) {
      return {
        title: 'Mama noticed you passed noodles',
        detail: 'Showing hearty whole foods like boiled yam, beans, and fresh vegetable plates.',
        iconName: 'restaurant-outline',
        tag: 'Variety rotation',
      };
    }

    // 3. Fast weeknight speed preference
    if (pass.timeLimitMinutes <= 12) {
      return {
        title: 'Mama noticed you need fast food',
        detail: `Keeping every single recommendation strictly under ${pass.timeLimitMinutes} minutes with 1 pan.`,
        iconName: 'time-outline',
        tag: 'Tired weeknight',
      };
    }

    // 4. Budget pattern
    const remainingBudget = pass.weeklyBudget - pass.spentThisWeek;
    if (pass.weeklyBudget > 0 && remainingBudget <= pass.weeklyBudget * 0.25) {
      return {
        title: 'Mama noticed your budget',
        detail: `Watching your weekly wallet carefully (${pass.currencySymbol}${Math.max(0, Math.round(remainingBudget))} left).`,
        iconName: 'wallet-outline',
        tag: 'Budget protection',
      };
    }

    // 5. Positive cooking habits (cooked favorite dishes)
    const cookedTitles = recentDecisions
      .filter((d) => d.action === 'cooked')
      .map((d) => d.dishTitle.toLowerCase());

    const plantainCooks = cookedTitles.filter((t) => t.includes('plantain') || t.includes('dodo')).length;
    if (plantainCooks >= 2) {
      return {
        title: 'Mama noticed you love plantains',
        detail: 'Curating recipes that make the most of sweet, caramelized golden dodo.',
        iconName: 'heart-outline',
        tag: 'Household favorite',
      };
    }

    // 6. Active dish session guidance
    if (sessionPassedTitles.length >= 2 && activeDishTitle) {
      return {
        title: 'Mama noticed you want variety',
        detail: `Learning your mood tonight. Shifted to ${activeDishTitle} for a fresh taste.`,
        iconName: 'bulb-outline',
        tag: 'Real-time tuning',
      };
    }

    // 7. Body & Wellness Goal alignment
    if (pass.bodyGoal === 'curves_glutes') {
      return {
        title: 'Mama tuned for your curves',
        detail: 'Prioritizing high-protein meals with wholesome complex carbs like yam, eggs, beans, and plantains.',
        iconName: 'heart-outline',
        tag: 'Body goal',
      };
    }

    if (pass.bodyGoal === 'reduce_weight') {
      return {
        title: 'Mama tuned for lean energy',
        detail: 'Highlighting high-protein, light-oil dishes with plenty of greens and gentle broths.',
        iconName: 'bulb-outline',
        tag: 'Body goal',
      };
    }

    if (pass.bodyGoal === 'add_weight') {
      return {
        title: 'Mama tuned for healthy bulk',
        detail: 'Curating hearty calorie-dense staples like beans & dodo, yam porridge, and rich stews.',
        iconName: 'restaurant-outline',
        tag: 'Body goal',
      };
    }

    return null;
  }
}

