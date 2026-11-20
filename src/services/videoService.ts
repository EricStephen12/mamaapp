import { apiClient } from './api/client';

export interface MealVideoData {
  id: string;
  videoUrl: string;
  coverUrl: string;
  title: string;
  duration: number;
  author: {
    nickname: string;
    unique_id: string;
    avatar?: string;
  };
  cached?: boolean;
}

interface CachedVideoEntry {
  data: MealVideoData;
  fetchedAt: number;
}

const CLIENT_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const videoResolutionCache = new Map<string, CachedVideoEntry>();
const pendingFetches = new Map<string, Promise<MealVideoData | null>>();

function normalizeDishKey(dishTitle: string): string {
  return (
    dishTitle
      .toLowerCase()
      .replace(
        /\b(mama'?s|smoky|party|special|ultimate|classic|quick|easy|authentic|homemade|delicious|crispy|spicy|sizzled|warm|fresh|street|style|bowl|plate|skillet|one-?pan|1-?pan)\b/gi,
        '',
      )
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || dishTitle.toLowerCase().trim()
  );
}

export const VideoService = {
  /**
   * Big-company video lookup:
   * - Canonical key normalization (avoids duplicate API calls for dish variations)
   * - 2h client memory cache (0ms instant reuse across Deck -> Meal Details -> Discover)
   * - Single-flight deduplication (concurrent calls for same dish share 1 HTTP request)
   */
  async resolveCookingVideo(
    dishTitle: string,
    ingredients?: string[],
  ): Promise<MealVideoData | null> {
    const key = normalizeDishKey(dishTitle);
    if (!key) return null;

    // 1. Return fresh cached result immediately (0 API calls)
    const cached = videoResolutionCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CLIENT_CACHE_TTL_MS) {
      return cached.data;
    }

    // 2. Single-flight: reuse any in-flight request for the same normalized dish
    if (pendingFetches.has(key)) {
      return pendingFetches.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        const response = await apiClient<{ success: boolean; video: MealVideoData | null }>(
          '/api/videos/search',
          {
            method: 'POST',
            skipAuth: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dish: dishTitle,
              ingredients,
            }),
            timeoutMs: 28000,
          },
        );

        const videoData = response?.success && response?.video?.videoUrl ? response.video : null;
        if (videoData) {
          videoResolutionCache.set(key, { data: videoData, fetchedAt: Date.now() });
        }
        return videoData;
      } catch (err) {
        if (__DEV__) {
          console.log(
            `[VideoService] Video unavailable for "${dishTitle}":`,
            err instanceof Error ? err.message : err,
          );
        }
        return null;
      } finally {
        pendingFetches.delete(key);
      }
    })();

    pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * Synchronous cache check for instant 0ms rendering across screens
   */
  getCachedVideo(dishTitle: string): MealVideoData | null {
    const key = normalizeDishKey(dishTitle);
    const cached = videoResolutionCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.fetchedAt >= CLIENT_CACHE_TTL_MS) {
      videoResolutionCache.delete(key);
      return null;
    }
    return cached.data;
  },
};
