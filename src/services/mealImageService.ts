import type { ImageSourcePropType } from 'react-native';

/**
 * Meal Poster / Placeholder Resolver
 * Zero Unsplash or external mock photos.
 * Uses Mama Kitchen's single minimal SVG plate placeholder (or local plate PNG fallback)
 * whenever a live cooking video thumbnail is not active.
 */

export const MAMA_MEAL_PLACEHOLDER_ASSET: ImageSourcePropType = require('../../assets/meal-placeholder.png');
export const MAMA_MEAL_PLACEHOLDER_URI = 'mama://plate-placeholder';

export const MealImageService = {
  /**
   * True when the URL is empty, points to our internal placeholder sentinel,
   * or is a stale external Unsplash mock URL from an older app cache.
   */
  isPlaceholderImage(url?: string | null): boolean {
    if (!url) return true;
    const trimmed = url.trim();
    if (!trimmed) return true;
    if (trimmed === MAMA_MEAL_PLACEHOLDER_URI || trimmed.startsWith('mama://')) return true;
    if (trimmed.includes('unsplash.com') || trimmed.includes('pexels.com') || trimmed.includes('picsum.photos')) {
      return true;
    }
    return false;
  },

  /**
   * Backwards-compatible alias used across collection/cards to detect placeholders.
   */
  isCatalogImage(url?: string | null): boolean {
    return MealImageService.isPlaceholderImage(url);
  },

  /**
   * Returns either the real non-mock image URI source or the bundled minimal plate asset.
   */
  getImageSource(url?: string | null): ImageSourcePropType {
    if (!MealImageService.isPlaceholderImage(url) && url) {
      return { uri: url };
    }
    return MAMA_MEAL_PLACEHOLDER_ASSET;
  },

  getFallbackMealImage(
    _title?: string,
    _ingredients: { name: string }[] = [],
    _cuisineAnchor: string = 'african_caribbean'
  ): string {
    return MAMA_MEAL_PLACEHOLDER_URI;
  },

  getCarouselDeckImages(
    meals: { title: string; ingredients?: { name: string }[]; imageUrl?: string }[],
    _cuisineAnchor: string = 'african_caribbean'
  ): string[] {
    return meals.map((meal) => {
      if (meal.imageUrl && !MealImageService.isPlaceholderImage(meal.imageUrl)) {
        return meal.imageUrl;
      }
      return MAMA_MEAL_PLACEHOLDER_URI;
    });
  },

  resolveMealImage(
    _title?: string,
    _ingredients: { name: string }[] = [],
    _cuisineAnchor: string = 'african_caribbean'
  ): string {
    return MAMA_MEAL_PLACEHOLDER_URI;
  },

  async generateMealImage(
    _title?: string,
    _ingredients: { name: string }[] = [],
    _cuisineAnchor: string = 'african_caribbean'
  ): Promise<string> {
    return MAMA_MEAL_PLACEHOLDER_URI;
  },

  async resolveMealImageAsync(
    _title?: string,
    _ingredients: { name: string }[] = [],
    _cuisineAnchor: string = 'african_caribbean'
  ): Promise<string> {
    return MAMA_MEAL_PLACEHOLDER_URI;
  },
};
