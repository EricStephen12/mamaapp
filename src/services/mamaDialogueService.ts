/**
 * Mama Dialogue Engine
 * Provides rich, cultural, witty, and contextual voice lines for Mama across all interactions.
 */

import { MealPeriod } from '../screens/04_daily_edit/mealCatalog';
import { UserKitchenPass } from './preferencesStore';

export const MAMA_COUNTRY_LINES: Record<string, string[]> = {
  NG: [
    "Ah, my Nigerian child! Before you spend ₦15,000 on delivery, remember we have plantain and eggs in the kitchen!",
    "You worked hard today. Sit down, take off your shoes, let Mama sort out your dinner.",
    "Pepper cures tiredness! Just a little ata rodo and sweet onion in the pan.",
    "Indomie with two soft-fried eggs and sliced plantain will fix any long day.",
    "No dirty pots in this house! One skillet, crisp the garlic, and eat straight from the bowl.",
  ],
  GB: [
    "London weather got you cold? A hot sizzled skillet will warm your hands right up.",
    "Put the kettle on, grab two eggs, and we'll make something ten times better than a cold meal deal.",
    "£25 on Deliveroo? Never while Mama is in your kitchen! We'll make this for £2.",
    "Crusty toasted sourdough with velvety eggs and a pinch of chili flakes. Pure comfort.",
    "Work was stressful? A warm home meal will help you switch off properly tonight.",
  ],
  US: [
    "Skip the $30 DoorDash trap and 45-minute wait. In 8 minutes you'll be eating in your sweatpants.",
    "Crisp tortilla, hot skillet, sunny eggs, and salsa. Fastest dinner in the world.",
    "You saved money and cooked clean tonight. Mama is proud of you!",
    "Simple food, big flavor. We're here to relax, not wash dishes until midnight.",
  ],
  GH: [
    "Akwaaba, my child! Delicious waakye aroma and golden plantains cure any tired soul.",
    "A spoonful of rich shito with warm rice and fried eggs. Fastest comfort alive!",
    "Take a breath, relax your mind. Good food is waiting for you.",
  ],
  KE: [
    "Karibu! Soft chapati and savory spiced eggs. Dinner doesn't need to be complicated.",
    "A hot pan with sweet onions and tomatoes will set your evening right.",
    "You worked hard today. Eat warm food and rest well.",
  ],
  EU: [
    "Good olive oil, ripe tomatoes, and crusty bread. Effortless luxury without dirty pots.",
    "A warm Mediterranean scramble with herbs and garlic will comfort you in minutes.",
    "Relax. Pour a glass of water, breathe, and let's eat well tonight.",
  ],
  CA: [
    "Cold evening outside? We'll make a hot, hearty 1-pan feast in under 12 minutes.",
    "Warm melted cheese, eggs, and toasted bread. Pure cozy comfort.",
  ],
};

export const MAMA_TIME_LINES: Record<MealPeriod, string[]> = {
  morning: [
    "Good morning, my child! Don't leave the house on an empty stomach.",
    "Protein first! 5 minutes in a hot skillet and your brain is ready for the day.",
    "A quick golden egg toast will keep you energized until lunch.",
  ],
  lunch: [
    "Step away from your laptop screen! Your body needs real food, not just coffee.",
    "Quick 8-minute noodles bowl. High comfort, fast energy for your afternoon.",
    "Eat sitting down. Don't rush your lunch!",
  ],
  dinner: [
    "Look at you, worked all day. Dinner should be comforting and zero hassle.",
    "The workday is officially done. Now comes the best part of your evening.",
    "One pan only. In this kitchen, we don't scrub pots when we're exhausted.",
    "A warm hot bowl and your favorite playlist. You earned this tonight.",
  ],
  late_night: [
    "Raiding the fridge at midnight? Mama won't judge. Let's make a quick 3-minute plate.",
    "Midnight hunger is real! Hot sizzled eggs and toast will hit the spot.",
    "Keep it light and warm so you sleep like a baby.",
  ],
};

export const MAMA_PASS_LINES = [
  "Not feeling this one? No problem! Mama has plenty of tricks in her recipe book.",
  "Too heavy for tonight? Let me show you something faster.",
  "Passed! Look at this next option, pure comfort.",
  "I'm listening! Mama learns what your stomach actually craves.",
  "On to the next plate. Zero pressure in this kitchen!",
];

export const MAMA_COOK_LINES = [
  "Now you're talking! Put the pan on medium heat, let's get you eating.",
  "Yes! High flavor, zero dishes. You're going to sleep very happy tonight.",
  "That's my child! In 8 minutes, dinner is on the table.",
  "Delicious choice! Follow my quick steps and enjoy every bite.",
];

export const MAMA_WISDOM_TIPS = [
  "Mama's secret: Always heat your skillet before adding oil. Your food will never stick!",
  "A pinch of salt in the onions while they fry pulls out all the sweet natural juices.",
  "Never wash 5 pots when 1 skillet can do the whole feast.",
  "Tired after work? Crack eggs straight into the hot sauce. Zero bowls to wash!",
  "Food cooked at home with love always tastes better than cold takeout in cardboard.",
  "Keep sweet onions and eggs in the kitchen, and you will never go to bed hungry.",
];

export class MamaDialogueService {
  /**
   * Get a dynamic quote for Mama on the Home Screen based on user's country, time, and active dish
   */
  static getDynamicQuote(
    period: MealPeriod,
    pass: UserKitchenPass,
    activeDishTitle?: string
  ): string {
    const countryLines = MAMA_COUNTRY_LINES[pass.country] || MAMA_COUNTRY_LINES.NG;
    const timeLines = MAMA_TIME_LINES[period] || MAMA_TIME_LINES.dinner;

    // Pick between a country-specific cultural line or a time-of-day comforting line
    const pool = [...countryLines, ...timeLines];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  /**
   * Get an interactive voice line when user taps on Mama
   */
  static getRandomInteractiveLine(pass: UserKitchenPass): { quote: string; pose: 'delighted' | 'cooking' | 'writing' | 'welcoming' } {
    const tips = MAMA_WISDOM_TIPS;
    const countryLines = MAMA_COUNTRY_LINES[pass.country] || MAMA_COUNTRY_LINES.NG;

    const combined = [
      ...tips.map((t) => ({ quote: t, pose: 'cooking' as const })),
      ...countryLines.map((c) => ({ quote: c, pose: 'delighted' as const })),
      { quote: `I'm keeping track of your budget in ${pass.currencySymbol}. You're doing great!`, pose: 'writing' as const },
      { quote: "Whenever you feel overwhelmed, come to the kitchen. Mama will feed you.", pose: 'welcoming' as const },
    ];

    const pick = combined[Math.floor(Math.random() * combined.length)];
    return pick;
  }

  /**
   * Mama's reaction when user swipes left ("Not today")
   */
  static getPassReaction(): string {
    return MAMA_PASS_LINES[Math.floor(Math.random() * MAMA_PASS_LINES.length)];
  }

  /**
   * Mama's reaction when user swipes right ("Cook today")
   */
  static getCookReaction(): string {
    return MAMA_COOK_LINES[Math.floor(Math.random() * MAMA_COOK_LINES.length)];
  }

  /**
   * Mama's greeting on the Discover screen tailored to country & taste
   */
  static getDiscoverQuote(pass: UserKitchenPass): string {
    const lines: Record<string, string[]> = {
      NG: [
        "Swipe right for what makes your belly sing! Mama notes every preference.",
        "Looking for pepper, plantain, or something fast? Tell Mama what you like.",
        "Don't worry about dishes tonight — I'll find you something quick and comforting.",
      ],
      GB: [
        "Fancy something cozy tonight? Swipe right and we'll save it to your kitchen pass.",
        "Zero Deliveroo guilt! Let's find something delicious within your weekly balance.",
        "Tell Mama what you fancy. A quick skillet meal or a local gem?",
      ],
      US: [
        "Skip the DoorDash fees! Swipe right on what looks delicious to you.",
        "Your weekly food budget is looking great. Let's find something satisfying.",
        "Tell Mama what you're craving tonight — I'm taking notes!",
      ],
    };
    const pool = lines[pass.country] || [
      "Swipe right to save to your collection, left to pass. Mama is learning!",
      "Every tap teaches Mama what you actually love to eat.",
      "Looking for something new? Let Mama surprise your appetite.",
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Mama's reaction when user toggles Discover filter
   */
  static getDiscoverFilterReaction(filter: 'all' | 'home' | 'eating_out'): string {
    if (filter === 'home') {
      return "Cooking at home! Low cost, zero fuss, clean food.";
    }
    if (filter === 'eating_out') {
      return "Treating yourself tonight? Mama picked spots within your weekly budget.";
    }
    return "All options on the table. Follow your appetite!";
  }
}
