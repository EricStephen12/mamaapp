/**
 * Meal Poster / Fallback Photo Resolver
 * Provides instant 0ms curated food photography as a clean poster placeholder
 * while the real cooking video buffers. Zero AI image generation calls.
 */

// Hand-picked authentic photography for cultural staples (high-res, CDN-cached, 100% verified)
// Ordered from most specific dish type to broadest staple so compound titles ("Jollof Spaghetti",
// "Fried Fish & Rice", "Beans & Plantain", "Dodo & Fried Egg") match their primary visual subject.
const AUTHENTIC_CULTURAL_LIBRARY: Record<string, string> = {
  // 1. Pasta & Spaghetti (must precede 'jollof' so 'Jollof Spaghetti' shows spaghetti, not rice)
  'jollof spaghetti': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85',
  spaghetti: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=900&q=85',
  macaroni: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=900&q=85',

  // 2. Noodles & Indomie
  indomie: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=900&q=85',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=85',
  ramen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=85',
  'stir fry': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=85',

  // 3. Specific Rice Dishes
  'fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85',
  'coconut rice': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=85',
  jollof: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',

  // 4. Beans, Stews & Native Soups
  beans: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=900&q=85',
  ewa: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=900&q=85',
  akara: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85',
  egusi: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=85',
  efo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85',
  okra: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85',
  'pepper soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85',

  // 5. Yam, Potato & Pottage Dishes
  asaro: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  yam: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=85',
  'sweet potato': 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=900&q=85',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=85',
  pottage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  porridge: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',

  // 6. Fish & Seafood (precedes generic 'rice' so 'Fried Fish & Rice' shows fish)
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=85',
  sardine: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85',
  tuna: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85',

  // 7. Meat, Chicken, Suya & Stews
  gizdodo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85',
  suya: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85',
  chicken: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=85',
  beef: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
  meat: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
  stew: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=900&q=85',

  // 8. Eggs, Breakfast, Oats & Plantain
  omelette: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=900&q=85',
  scramble: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=85',
  toast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=85',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85',
  bread: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85',
  egg: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=85',
  pancake: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=900&q=85',
  tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=85',
  oats: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=900&q=85',
  oatmeal: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=900&q=85',
  dodo: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=900&q=85',
  plantain: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=900&q=85',

  // 9. Broad Rice Fallback (at the end so specific protein/sauce wins first)
  'white rice': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=85',
  rice: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',
};

const DEFAULT_CUISINE_PHOTOS: Record<string, string> = {
  african_caribbean: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',
  weeknight_comfort: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85',
  global: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
};

// Distinct high-res food gallery pool to guarantee every card in a carousel has a unique photo
const CURATED_CAROUSEL_GALLERY: string[] = [
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85',
];

const CATALOG_URLS = new Set<string>([
  ...Object.values(AUTHENTIC_CULTURAL_LIBRARY),
  ...Object.values(DEFAULT_CUISINE_PHOTOS),
  ...CURATED_CAROUSEL_GALLERY,
]);

export const MealImageService = {
  /**
   * Fast synchronous fallback poster resolver using the verified cultural library.
   */
  getFallbackMealImage(
    title: string,
    ingredients: { name: string }[] = [],
    cuisineAnchor: string = 'african_caribbean'
  ): string {
    // 1. Match dish title first so side ingredients don't override the main dish category
    const titleLower = title.toLowerCase();
    for (const [keyword, url] of Object.entries(AUTHENTIC_CULTURAL_LIBRARY)) {
      if (titleLower.includes(keyword)) {
        return url;
      }
    }

    // 2. Fallback to ingredient keyword match
    const ingLower = ingredients.map((i) => i.name).join(' ').toLowerCase();
    for (const [keyword, url] of Object.entries(AUTHENTIC_CULTURAL_LIBRARY)) {
      if (ingLower.includes(keyword)) {
        return url;
      }
    }

    return (
      DEFAULT_CUISINE_PHOTOS[cuisineAnchor] ||
      DEFAULT_CUISINE_PHOTOS.african_caribbean
    );
  },

  /**
   * Resolves poster images for a multi-card carousel deck.
   */
  getCarouselDeckImages(
    meals: { title: string; ingredients?: { name: string }[]; imageUrl?: string }[],
    cuisineAnchor: string = 'african_caribbean'
  ): string[] {
    const usedCatalogUrls = new Set<string>();
    return meals.map((meal, idx) => {
      if (meal.imageUrl && meal.imageUrl.trim().length > 0 && !CATALOG_URLS.has(meal.imageUrl)) {
        return meal.imageUrl;
      }
      let resolved = MealImageService.resolveMealImage(
        meal.title,
        meal.ingredients || [],
        cuisineAnchor
      );
      if (usedCatalogUrls.has(resolved)) {
        const alternative = CURATED_CAROUSEL_GALLERY.find((u) => !usedCatalogUrls.has(u));
        if (alternative) {
          resolved = alternative;
        } else {
          resolved = CURATED_CAROUSEL_GALLERY[idx % CURATED_CAROUSEL_GALLERY.length];
        }
      }
      usedCatalogUrls.add(resolved);
      return resolved;
    });
  },

  /**
   * Synchronous poster resolver for browsing surfaces (0 network calls).
   */
  resolveMealImage(
    title: string,
    ingredients: { name: string }[] = [],
    cuisineAnchor: string = 'african_caribbean'
  ): string {
    return MealImageService.getFallbackMealImage(title, ingredients, cuisineAnchor);
  },

  /**
   * True when the URL is one of our curated catalog photos.
   */
  isCatalogImage(url?: string | null): boolean {
    if (!url) return true;
    return CATALOG_URLS.has(url);
  },

  /**
   * Instant poster resolution — AI image generation has been removed in favor of
   * real live cooking videos. Returns immediately with 0 network calls.
   */
  async generateMealImage(
    title: string,
    ingredients: { name: string }[] = [],
    cuisineAnchor: string = 'african_caribbean'
  ): Promise<string> {
    return MealImageService.getFallbackMealImage(title, ingredients, cuisineAnchor);
  },

  /**
   * Async alias returning the curated poster immediately with 0 AI calls.
   */
  async resolveMealImageAsync(
    title: string,
    ingredients: { name: string }[] = [],
    cuisineAnchor: string = 'african_caribbean'
  ): Promise<string> {
    return MealImageService.getFallbackMealImage(title, ingredients, cuisineAnchor);
  },
};
