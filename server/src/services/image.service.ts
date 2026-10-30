import dotenv from 'dotenv';

dotenv.config();

/**
 * ImageService
 * Generates food images via FLUX.1 (Schnell) from multiple providers:
 * 1. Cloudflare Workers AI (Free Edge GPUs)
 * 2. Fal.ai (~0.6s latency)
 * 3. Together AI (~1.5s latency)
 *
 * If ALL providers fail, returns null so callers can handle the missing image
 * gracefully (empty state) instead of showing a hardcoded third-party URL.
 */

// In-memory image cache to prevent redundant generation calls
const imageCache = new Map<string, string>();

export class ImageService {
  /**
   * Generate an image using FLUX.1.
   * Returns null if all providers are unavailable — callers must handle null.
   */
  static async generateFoodImage(
    prompt: string,
    mealType?: string,
  ): Promise<{ imageUrl: string; provider: string; cached: boolean } | null> {
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
            const data = (await response.json()) as { result?: { image?: string } };
            if (data?.result?.image) {
              const imageUrl = `data:image/jpeg;base64,${data.result.image}`;
              imageCache.set(cacheKey, imageUrl);
              return { imageUrl, provider: 'cloudflare-workers-flux-schnell', cached: false };
            }
          }
        }
      } catch (err) {
        console.warn('[ImageService] Cloudflare Workers AI error, trying fallback:', err);
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
        console.warn('[ImageService] Fal.ai error, trying next fallback:', err);
      }
    }

    // 4. Try Together AI (alternative Flux host)
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
        console.warn('[ImageService] Together AI error:', err);
      }
    }

    // All providers unavailable — return null, never fall back to external images
    console.warn('[ImageService] All providers unavailable. No image generated.');
    return null;
  }
}
