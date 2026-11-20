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

const videoResolutionCache = new Map<string, MealVideoData | null>();
const pendingFetches = new Map<string, Promise<MealVideoData | null>>();

export const VideoService = {
  /**
   * Fetches the best viral cooking video for a given dish title and optional ingredients.
   * Cached in memory for instant recall. Returns null if no video is available.
   */
  async resolveCookingVideo(
    dishTitle: string,
    ingredients?: string[],
  ): Promise<MealVideoData | null> {
    const key = dishTitle.trim().toLowerCase();

    // 1. Return cached result if already resolved
    if (videoResolutionCache.has(key)) {
      return videoResolutionCache.get(key) || null;
    }

    // 2. Prevent duplicate concurrent fetches for the same dish
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
            timeoutMs: 9000,
          },
        );

        const videoData = response?.success && response?.video ? response.video : null;
        videoResolutionCache.set(key, videoData);
        return videoData;
      } catch {
        // Quietly fall back to high-res meal image if video is temporarily unavailable
        videoResolutionCache.set(key, null);
        return null;
      } finally {
        pendingFetches.delete(key);
      }
    })();

    pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * Synchronous cache check for zero-wait rendering
   */
  getCachedVideo(dishTitle: string): MealVideoData | null {
    const key = dishTitle.trim().toLowerCase();
    return videoResolutionCache.get(key) || null;
  },
};

