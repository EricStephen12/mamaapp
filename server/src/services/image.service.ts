import dotenv from 'dotenv';

dotenv.config();

/**
 * ImageService
 * Supports FLUX.1 (Schnell / Dev) via hosted serverless APIs:
 * 1. Fal.ai (Recommended: 0.5s - 1.2s latency, ~$0.003/image)
 * 2. Together AI (1.5s latency, ~$0.003/image)
 * 3. Replicate (2s latency)
 * 
 * Includes an in-memory cache and high-quality culinary fallback images
 * so the mobile app always renders beautiful visuals instantly without waiting.
 */

// High quality curated culinary photos for instant fallback
const CURATED_FOOD_IMAGES: Record<string, string> = {
  rice: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  egg: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
};

// In-memory image cache to prevent redundant generation calls
const imageCache = new Map<string, string>();

export class ImageService {
  /**
   * Generate an image using FLUX.1
   */
  static async generateFoodImage(prompt: string, mealType = 'default'): Promise<{ imageUrl: string; provider: string; cached: boolean }> {
    // 1. Check cache first
    const cacheKey = prompt.trim().toLowerCase();
    if (imageCache.has(cacheKey)) {
      return { imageUrl: imageCache.get(cacheKey)!, provider: 'cache', cached: true };
    }

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const falKey = process.env.FAL_KEY;
    const togetherKey = process.env.TOGETHER_API_KEY;

    // Enhance prompt with editorial food photography styling
    const enhancedPrompt = `${prompt}, appetizing gourmet food photography, Michelin editorial style, natural 45-degree diffused window lighting, shallow depth of field, 50mm f/1.8 lens, high culinary aesthetics, photorealistic, no text, no watermark`;

    // 2. Try Cloudflare Workers AI (Free Edge GPUs, FLUX.1 Schnell)
    if (cfAccountId && cfApiToken) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              steps: 4,
            }),
          }
        );

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('image')) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const imageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
            imageCache.set(cacheKey, imageUrl);
            return { imageUrl, provider: 'cloudflare-workers-flux-schnell', cached: false };
          } else {
            // Some Cloudflare endpoints return JSON with base64 image
            const data = (await response.json()) as { result?: { image?: string } };
            if (data?.result?.image) {
              const imageUrl = `data:image/jpeg;base64,${data.result.image}`;
              imageCache.set(cacheKey, imageUrl);
              return { imageUrl, provider: 'cloudflare-workers-flux-schnell', cached: false };
            }
          }
        }
      } catch (err) {
        console.warn('[ImageService] Cloudflare Workers AI request error, trying fallback:', err);
      }
    }

    // 3. Try Fal.ai (fastest serverless Flux engine, ~0.6s)
    if (falKey) {
      try {
        const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: {
            Authorization: `Key ${falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            image_size: 'square_hd',
            num_inference_steps: 4,
            enable_safety_checker: true,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { images?: { url: string }[] };
          const imageUrl = data?.images?.[0]?.url;
          if (imageUrl) {
            imageCache.set(cacheKey, imageUrl);
            return { imageUrl, provider: 'fal-flux-schnell', cached: false };
          }
        }
      } catch (err) {
        console.warn('[ImageService] Fal.ai request error, trying fallback:', err);
      }
    }

    // 3. Try Together AI (alternative Flux host)
    if (togetherKey) {
      try {
        const response = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${togetherKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'black-forest-labs/FLUX.1-schnell',
            prompt: enhancedPrompt,
            width: 768,
            height: 768,
            steps: 4,
            n: 1,
            response_format: 'url',
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { data?: { url: string }[] };
          const imageUrl = data?.data?.[0]?.url;
          if (imageUrl) {
            imageCache.set(cacheKey, imageUrl);
            return { imageUrl, provider: 'together-flux-schnell', cached: false };
          }
        }
      } catch (err) {
        console.warn('[ImageService] Together AI request error:', err);
      }
    }

    // 4. Return instant curated aesthetic food imagery if API keys are pending
    const matchKey = Object.keys(CURATED_FOOD_IMAGES).find((k) => prompt.toLowerCase().includes(k)) || mealType || 'default';
    const fallbackUrl = CURATED_FOOD_IMAGES[matchKey] || CURATED_FOOD_IMAGES.default;

    return {
      imageUrl: fallbackUrl,
      provider: 'curated-fallback',
      cached: false,
    };
  }
}
