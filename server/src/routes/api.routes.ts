import { Router, Request, Response } from 'express';
import { GroqService } from '../services/groq.service.js';
import { ImageService } from '../services/image.service.js';
import { prisma } from '../db/prisma.js';

export const apiRouter = Router();

/**
 * Health Check & Status
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
    cloudflareConfigured: !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
    dbConfigured: !!process.env.DATABASE_URL,
    providers: {
      llm: 'Groq (openai/gpt-oss-120b)',
      images: process.env.CLOUDFLARE_ACCOUNT_ID ? 'Cloudflare Workers AI (FLUX.1)' : 'Curated Michelin CDN',
    },
  });
});

/**
 * Analyze ingredients currently in the kitchen/pantry
 * POST /api/kitchen/analyze
 * Body: { items: string[] }
 */
apiRouter.post('/kitchen/analyze', async (req: Request, res: Response) => {
  try {
    const items = (req.body?.items as string[]) || [];
    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Please provide a non-empty array of items.' });
      return;
    }

    const analysis = await GroqService.analyzePantry(items);
    res.json(analysis);
  } catch (error) {
    console.error('[API] /kitchen/analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze pantry ingredients' });
  }
});

/**
 * Generate Curated Daily Edit for the user's home screen
 * POST /api/daily-edit
 * Body: { pantryItems: string[], tone?: string, kitchenPass?: any }
 */
apiRouter.post('/daily-edit', async (req: Request, res: Response) => {
  try {
    const pantryItems = (req.body?.pantryItems as string[]) || ['Eggs', 'Tomatoes', 'Rice', 'Scallions'];
    const kitchenPass = req.body?.kitchenPass;

    const dailyEdit = await GroqService.generateDailyEdit(pantryItems, kitchenPass);

    if (dailyEdit.makeNowMeal?.imagePrompt) {
      const imgResult = await ImageService.generateFoodImage(dailyEdit.makeNowMeal.imagePrompt, 'rice');
      // @ts-expect-error adding generated image url to response
      dailyEdit.makeNowMeal.imageUrl = imgResult.imageUrl;
    }

    res.json(dailyEdit);
  } catch (error) {
    console.error('[API] /daily-edit error:', error);
    res.status(500).json({ error: 'Failed to generate daily edit' });
  }
});

/**
 * Generate a complete recipe on demand
 * POST /api/recipes/generate
 * Body: { availableIngredients: string[], titleSuggestion?: string }
 */
apiRouter.post('/recipes/generate', async (req: Request, res: Response) => {
  try {
    const ingredients = (req.body?.availableIngredients as string[]) || ['Eggs', 'Tomatoes', 'Rice'];
    const title = req.body?.titleSuggestion as string | undefined;

    const recipe = await GroqService.generateRecipe(ingredients, title);

    if (recipe.imagePrompt) {
      const imageResult = await ImageService.generateFoodImage(recipe.imagePrompt);
      // @ts-expect-error adding generated image url
      recipe.imageUrl = imageResult.imageUrl;
    }

    res.json(recipe);
  } catch (error) {
    console.error('[API] /recipes/generate error:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

/**
 * Cloudflare Workers AI / Fal Image Generation
 * POST /api/images/generate
 * Body: { prompt: string, mealType?: string }
 */
apiRouter.post('/images/generate', async (req: Request, res: Response) => {
  try {
    const prompt = req.body?.prompt as string;
    const mealType = req.body?.mealType as string;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const result = await ImageService.generateFoodImage(prompt, mealType);
    res.json(result);
  } catch (error) {
    console.error('[API] /images/generate error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

/**
 * User Profile & Taste Settings
 * GET /api/user/profile
 */
apiRouter.get('/user/profile', async (_req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      res.json({ message: 'Database not connected, using client state' });
      return;
    }
    const user = await prisma.user.findFirst({
      include: { tasteProfile: true },
    });
    res.json(user || null);
  } catch (error) {
    console.error('[API] /user/profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Saved Meals Collection
 * GET /api/saved-meals
 */
apiRouter.get('/saved-meals', async (_req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      res.json([]);
      return;
    }
    const meals = await prisma.savedMeal.findMany({
      orderBy: { savedAt: 'desc' },
    });
    res.json(meals);
  } catch (error) {
    console.error('[API] /saved-meals error:', error);
    res.status(500).json({ error: 'Failed to fetch saved meals' });
  }
});

/**
 * Log Meal Decision (Cooked / Passed)
 * POST /api/decisions
 * Body: { dishId: string, dishTitle: string, action: 'cooked' | 'passed', mealCost: number, passReason?: string }
 */
apiRouter.post('/decisions', async (req: Request, res: Response) => {
  try {
    const { dishId, dishTitle, action, mealCost, passReason } = req.body;
    if (!process.env.DATABASE_URL) {
      res.json({ logged: true, offline: true });
      return;
    }

    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: "Mama's Child",
          country: 'NG',
          currencyCode: 'NGN',
          currencySymbol: '₦',
          weeklyBudget: 35000,
          spentThisWeek: 0,
        },
      });
    }

    const decision = await prisma.mealDecision.create({
      data: {
        userId: defaultUser.id,
        dishId: dishId || 'dish-unknown',
        dishTitle: dishTitle || 'Unknown Dish',
        action: action || 'cooked',
        mealCost: parseFloat(mealCost) || 0,
        passReason: passReason || null,
      },
    });

    if (action === 'cooked' && mealCost > 0) {
      await prisma.user.update({
        where: { id: defaultUser.id },
        data: {
          spentThisWeek: { increment: parseFloat(mealCost) },
        },
      });
    }

    res.json({ success: true, decision });
  } catch (error) {
    console.error('[API] /decisions error:', error);
    res.status(500).json({ error: 'Failed to record decision' });
  }
});
