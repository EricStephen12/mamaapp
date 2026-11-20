import dotenv from 'dotenv';
import path from 'path';

// Load server/.env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

export interface VideoAuthor {
  nickname: string;
  unique_id: string;
  avatar?: string;
}

export interface VideoResult {
  id: string;
  videoUrl: string;
  coverUrl: string;
  title: string;
  duration: number;
  author: VideoAuthor;
  source: 'tiktok' | 'cache';
  cached?: boolean;
}

// In-memory cache to save RapidAPI requests (TTL: 48 hours)
interface CacheEntry {
  data: VideoResult;
  timestamp: number;
}

const videoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export class VideoService {
  /**
   * Search for an authentic, viral cooking video for a given meal or ingredients.
   * Returns null if no video found or if the API key is not configured.
   */
  static async searchCookingVideo(
    dishName: string,
    ingredients?: string[],
  ): Promise<VideoResult | null> {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_TIKTOK_HOST || 'tiktok-video-no-watermark2.p.rapidapi.com';

    if (!rapidApiKey) {
      console.warn('[VideoService] RAPIDAPI_KEY is not configured in environment.');
      return null;
    }

    // 1. Check in-memory cache
    const cacheKey = dishName.trim().toLowerCase();
    const cached = videoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, source: 'cache', cached: true };
    }

    // 2. Build smart search query
    const query = this.buildSearchQuery(dishName, ingredients);

    try {
      const url = `https://${rapidApiHost}/feed/search?keywords=${encodeURIComponent(query)}&count=5&cursor=0`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': rapidApiHost,
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        console.error(`[VideoService] RapidAPI error: ${response.status} ${response.statusText}`);
        return null;
      }

      const json = await response.json();
      if (!json || json.code !== 0 || !json.data || !Array.isArray(json.data.videos)) {
        console.warn('[VideoService] No videos returned from RapidAPI for query:', query);
        return null;
      }

      // 3. Find the best cooking video from the results
      const video = this.pickBestCookingVideo(json.data.videos);
      if (!video) return null;

      const result: VideoResult = {
        id: video.video_id || video.aweme_id || String(Date.now()),
        videoUrl: video.play || video.wmplay,
        coverUrl: video.cover || video.origin_cover || '',
        title: video.title || dishName,
        duration: typeof video.duration === 'number' ? video.duration : 0,
        author: {
          nickname: video.author?.nickname || 'Food Creator',
          unique_id: video.author?.unique_id || 'chef',
          avatar: video.author?.avatar,
        },
        source: 'tiktok',
      };

      // Cache it
      videoCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('[VideoService] Failed to search cooking video:', error);
      return null;
    }
  }

  /**
   * Refines the search query so TikTok returns authentic recipe and cooking videos.
   */
  private static buildSearchQuery(dishName: string, ingredients?: string[]): string {
    // Strip common filler adjectives
    let cleaned = dishName
      .replace(/\b(mama'?s|special|ultimate|classic|quick|easy|authentic|homemade|delicious|crispy)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If query is very short or generic, append key ingredients
    if (ingredients && ingredients.length > 0 && cleaned.split(' ').length < 2) {
      cleaned += ` ${ingredients.slice(0, 2).join(' ')}`;
    }

    // Always append "recipe" to prioritize cooking instruction videos
    if (!/recipe|cook|food/i.test(cleaned)) {
      cleaned += ' recipe';
    }

    return cleaned;
  }

  /**
   * Filters results to pick the video most likely to be a clean, appetizing cooking video.
   */
  private static pickBestCookingVideo(videos: any[]): any | null {
    if (!videos.length) return null;

    // Filter out ads or videos without valid play url
    const valid = videos.filter((v) => !v.is_ad && (v.play || v.wmplay));
    if (!valid.length) return null;

    // Prefer videos between 10s and 120s (ideal for cooking reels/steps)
    const idealDuration = valid.filter((v) => v.duration >= 10 && v.duration <= 180);
    return idealDuration.length > 0 ? idealDuration[0] : valid[0];
  }
}
