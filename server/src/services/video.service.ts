import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../db/prisma.js';

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

// L1 In-Memory Cache (0ms, per instance)
interface CacheEntry {
  data: VideoResult;
  timestamp: number;
}

const videoCache = new Map<string, CacheEntry>();
// Single-flight map: deduplicates concurrent requests for the same dish across all users
const inFlightRequests = new Map<string, Promise<VideoResult | null>>();

// TikTok signed CDN links remain fresh for ~4-6h; 3.5h TTL prevents expired links while cutting API calls by 99%
const CACHE_TTL_MS = 3.5 * 60 * 60 * 1000;

// Circuit breaker if RapidAPI returns 429 rate-limit
let rateLimitedUntil = 0;

// Lazy DB table bootstrap for L2 Shared Postgres Cache
let dbTableReady = false;
async function ensureVideoCacheTable(): Promise<boolean> {
  if (dbTableReady) return true;
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS video_cache (
        cache_key TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        video_url TEXT NOT NULL,
        cover_url TEXT NOT NULL,
        title TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        author_nickname TEXT NOT NULL,
        author_unique_id TEXT NOT NULL,
        author_avatar TEXT,
        cached_at BIGINT NOT NULL
      );
    `);
    dbTableReady = true;
    return true;
  } catch (err) {
    console.warn('[VideoService] Postgres video_cache bootstrap skipped:', (err as Error)?.message);
    return false;
  }
}

async function readFromDbCache(cacheKey: string): Promise<VideoResult | null> {
  if (!(await ensureVideoCacheTable())) return null;
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        video_id: string;
        video_url: string;
        cover_url: string;
        title: string;
        duration: number;
        author_nickname: string;
        author_unique_id: string;
        author_avatar: string | null;
        cached_at: string | bigint | number;
      }>
    >(
      `SELECT video_id, video_url, cover_url, title, duration, author_nickname, author_unique_id, author_avatar, cached_at
       FROM video_cache WHERE cache_key = $1 LIMIT 1`,
      cacheKey,
    );
    const row = rows?.[0];
    if (!row) return null;

    const ageMs = Date.now() - Number(row.cached_at);
    if (ageMs >= CACHE_TTL_MS) return null;

    return {
      id: row.video_id,
      videoUrl: row.video_url,
      coverUrl: row.cover_url,
      title: row.title,
      duration: Number(row.duration) || 0,
      author: {
        nickname: row.author_nickname,
        unique_id: row.author_unique_id,
        avatar: row.author_avatar || undefined,
      },
      source: 'cache',
      cached: true,
    };
  } catch {
    return null;
  }
}

async function writeToDbCache(cacheKey: string, video: VideoResult): Promise<void> {
  if (!(await ensureVideoCacheTable())) return;
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO video_cache (cache_key, video_id, video_url, cover_url, title, duration, author_nickname, author_unique_id, author_avatar, cached_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (cache_key) DO UPDATE SET
         video_id = EXCLUDED.video_id,
         video_url = EXCLUDED.video_url,
         cover_url = EXCLUDED.cover_url,
         title = EXCLUDED.title,
         duration = EXCLUDED.duration,
         author_nickname = EXCLUDED.author_nickname,
         author_unique_id = EXCLUDED.author_unique_id,
         author_avatar = EXCLUDED.author_avatar,
         cached_at = EXCLUDED.cached_at`,
      cacheKey,
      video.id,
      video.videoUrl,
      video.coverUrl,
      video.title,
      Math.round(video.duration || 0),
      video.author.nickname,
      video.author.unique_id,
      video.author.avatar || null,
      Date.now(),
    );
  } catch {
    // Non-fatal: L1 memory cache still holds the entry
  }
}

export class VideoService {
  /**
   * Canonical key so slight variations ("Smoky Party Jollof Rice" vs "Jollof Rice")
   * share a single cached video across ALL users.
   */
  static normalizeCacheKey(dishName: string): string {
    return dishName
      .toLowerCase()
      .replace(/\b(mama'?s|smoky|party|special|ultimate|classic|quick|easy|authentic|homemade|delicious|crispy|spicy|sizzled|warm|fresh|street|style|bowl|plate|skillet|one-?pan|1-?pan)\b/gi, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || dishName.toLowerCase().trim();
  }

  /**
   * 3-Tier Big-Company Video Lookup:
   * L1 Memory -> L2 Shared Postgres Cache -> Single-Flight RapidAPI Fetch
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

    const cacheKey = this.normalizeCacheKey(dishName);

    // 1. L1 In-Memory Cache (instant 0ms)
    const memEntry = videoCache.get(cacheKey);
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
      return { ...memEntry.data, source: 'cache', cached: true };
    }

    // 2. Single-Flight Coalescing (if another user is already fetching this dish, wait for it)
    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const job = (async (): Promise<VideoResult | null> => {
      // 3. L2 Shared Postgres Cache (survives Render sleep/restarts & shared across all users)
      const dbHit = await readFromDbCache(cacheKey);
      if (dbHit) {
        videoCache.set(cacheKey, { data: dbHit, timestamp: Date.now() });
        return dbHit;
      }

      // 4. Circuit Breaker guard if RapidAPI recently returned 429
      if (Date.now() < rateLimitedUntil) {
        return null;
      }

      // 5. Fresh RapidAPI Fetch (only runs ONCE per dish every 3.5 hours globally!)
      const query = this.buildSearchQuery(dishName, ingredients);

      try {
        const url = `https://${rapidApiHost}/feed/search?keywords=${encodeURIComponent(query)}&count=5&cursor=0`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': rapidApiHost,
          },
        });

        clearTimeout(timer);

        if (response.status === 429) {
          console.warn('[VideoService] RapidAPI 429 rate-limited; cooling down 60s');
          rateLimitedUntil = Date.now() + 60_000;
          return null;
        }

        if (!response.ok) {
          console.error(`[VideoService] RapidAPI error: ${response.status} ${response.statusText}`);
          return null;
        }

        const json = await response.json();
        if (!json || json.code !== 0 || !json.data || !Array.isArray(json.data.videos)) {
          return null;
        }

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

        // Write to both L1 (Memory) and L2 (Shared Neon Postgres)
        videoCache.set(cacheKey, { data: result, timestamp: Date.now() });
        await writeToDbCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error('[VideoService] Failed to search cooking video:', error);
        return null;
      }
    })().finally(() => {
      inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, job);
    return job;
  }

  /**
   * Refines the search query so TikTok returns authentic recipe and cooking videos.
   */
  private static buildSearchQuery(dishName: string, ingredients?: string[]): string {
    let cleaned = this.normalizeCacheKey(dishName);

    if (ingredients && ingredients.length > 0 && cleaned.split(' ').length < 2) {
      cleaned += ` ${ingredients.slice(0, 2).join(' ')}`;
    }

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
    const valid = videos.filter((v) => !v.is_ad && (v.play || v.wmplay));
    if (!valid.length) return null;
    const idealDuration = valid.filter((v) => v.duration >= 10 && v.duration <= 180);
    return idealDuration.length > 0 ? idealDuration[0] : valid[0];
  }
}
