import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Note: /api/health, /api/daily-edit, /api/kitchen/analyze, /api/recipes/generate,
// and /api/images/generate are public routes defined in server/src/index.ts
// (no auth required for AI generation endpoints).

export const apiRouter = Router();

/**
 * Helper to identify the authenticated user from the JWT
 */
async function getTargetUser(req: Request) {
  const userId = (req as AuthRequest).userId;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tasteProfile: true },
    });
    if (user) return user;
  }
  // Fallback: first user in DB (dev mode only)
  let defaultUser = await prisma.user.findFirst({ include: { tasteProfile: true } });
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        name: "Mama's Child",
        country: 'NG',
        countryName: 'Nigeria',
        currencyCode: 'NGN',
        currencySymbol: '₦',
        weeklyBudget: 35000,
        spentThisWeek: 0,
      },
      include: { tasteProfile: true },
    });
  }
  return defaultUser;
}

/**
 * User Profile & Preferences
 * GET /api/user/profile or GET /api/user/preferences
 */
apiRouter.get(['/user/profile', '/user/preferences'], async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    res.json(user);
  } catch (error) {
    console.error('[API] /user/preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

/**
 * Update User Kitchen Pass & Taste Profile in Neon DB
 * POST /api/user/preferences
 */
apiRouter.post('/user/preferences', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const {
      country,
      countryName,
      currencyCode,
      currencySymbol,
      weeklyBudget,
      spentThisWeek,
      cuisineAnchor,
      cuisineLabel,
      cookingGear,
      cookingGearLabel,
      timeLimitMinutes,
      timeLimitLabel,
      stapleBase,
      stapleBaseLabel,
      spiceLevel,
      dietaryRestrictions,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(country ? { country } : {}),
        ...(countryName ? { countryName } : {}),
        ...(currencyCode ? { currencyCode } : {}),
        ...(currencySymbol ? { currencySymbol } : {}),
        ...(weeklyBudget !== undefined ? { weeklyBudget: Number(weeklyBudget) } : {}),
        ...(spentThisWeek !== undefined ? { spentThisWeek: Number(spentThisWeek) } : {}),
      },
    });

    if (cuisineAnchor || cookingGear || timeLimitMinutes || stapleBase || spiceLevel) {
      await prisma.tasteProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          cuisineAnchor: cuisineAnchor || 'african_caribbean',
          cuisineLabel: cuisineLabel || 'African & Caribbean',
          cookingGear: cookingGear || 'one_pan',
          cookingGearLabel: cookingGearLabel || '1 Pan & Burner',
          timeLimitMinutes: Number(timeLimitMinutes) || 12,
          timeLimitLabel: timeLimitLabel || 'Under 15 mins',
          stapleBase: stapleBase || 'rice',
          stapleBaseLabel: stapleBaseLabel || 'Rice & Grains',
          spiceLevel: spiceLevel || 'warm',
          dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
        },
        update: {
          ...(cuisineAnchor ? { cuisineAnchor } : {}),
          ...(cuisineLabel ? { cuisineLabel } : {}),
          ...(cookingGear ? { cookingGear } : {}),
          ...(cookingGearLabel ? { cookingGearLabel } : {}),
          ...(timeLimitMinutes ? { timeLimitMinutes: Number(timeLimitMinutes) } : {}),
          ...(timeLimitLabel ? { timeLimitLabel } : {}),
          ...(stapleBase ? { stapleBase } : {}),
          ...(stapleBaseLabel ? { stapleBaseLabel } : {}),
          ...(spiceLevel ? { spiceLevel } : {}),
          ...(dietaryRestrictions ? { dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [] } : {}),
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tasteProfile: true },
    });

    res.json({ success: true, user: fullUser });
  } catch (error) {
    console.error('[API] POST /user/preferences error:', error);
    res.status(500).json({ error: 'Failed to save preferences to database' });
  }
});

/**
 * Saved Meals Collection
 * GET /api/saved-meals
 */
apiRouter.get('/saved-meals', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const meals = await prisma.savedMeal.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' },
    });
    res.json(meals);
  } catch (error) {
    console.error('[API] /saved-meals error:', error);
    res.status(500).json({ error: 'Failed to fetch saved meals' });
  }
});

/**
 * Save Meal to Collection in Neon DB
 * POST /api/saved-meals
 */
apiRouter.post('/saved-meals', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const {
      mealId,
      title,
      type = 'home',
      cookTime = '15 min',
      cost = '$2.50',
      costNumeric = 2.5,
      imageUrl = '',
      recipeSteps = [],
      ingredients,
      spotName,
      vibe,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Meal title is required.' });
      return;
    }

    const resolvedMealId = mealId || `meal-${Date.now()}`;
    await prisma.savedMeal.deleteMany({
      where: {
        userId: user.id,
        mealId: resolvedMealId,
      },
    });

    let savedMeal;
    try {
      savedMeal = await prisma.savedMeal.create({
        data: {
          userId: user.id,
          mealId: resolvedMealId,
          title,
          type,
          cookTime,
          cost,
          costNumeric: Number(costNumeric) || 2.5,
          imageUrl: imageUrl || '',
          recipeSteps: Array.isArray(recipeSteps) ? recipeSteps : [],
          ingredients: ingredients ? (typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients) : undefined,
          spotName: spotName || null,
          vibe: vibe || null,
        },
      });
    } catch {
      // Auto-heal Neon DB SavedMeal columns if schema migration hasn't been pushed yet
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "SavedMeal" ADD COLUMN IF NOT EXISTS "ingredients" JSONB, ADD COLUMN IF NOT EXISTS "spotName" TEXT, ADD COLUMN IF NOT EXISTS "vibe" TEXT; ALTER TABLE "SavedMeal" ALTER COLUMN "imageUrl" DROP NOT NULL;`
      ).catch(() => {});

      savedMeal = await prisma.savedMeal.create({
        data: {
          userId: user.id,
          mealId: resolvedMealId,
          title,
          type,
          cookTime,
          cost,
          costNumeric: Number(costNumeric) || 2.5,
          imageUrl: imageUrl || '',
          recipeSteps: Array.isArray(recipeSteps) ? recipeSteps : [],
          ingredients: ingredients ? (typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients) : undefined,
          spotName: spotName || null,
          vibe: vibe || null,
        },
      });
    }

    res.json({ success: true, meal: savedMeal });
  } catch (error: any) {
    console.error('[API] POST /saved-meals error:', error);
    res.status(500).json({ error: error?.message || 'Failed to save meal to database' });
  }
});

/**
 * Remove Saved Meal from Neon DB
 * DELETE /api/saved-meals/:id
 */
apiRouter.delete('/saved-meals/:id', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const id = req.params.id as string;

    await prisma.savedMeal.deleteMany({
      where: {
        userId: user.id,
        OR: [{ id }, { mealId: id }],
      },
    });

    res.json({ success: true, removedId: id });
  } catch (error) {
    console.error('[API] DELETE /saved-meals/:id error:', error);
    res.status(500).json({ error: 'Failed to delete saved meal' });
  }
});

/**
 * Log Meal Decision (Cooked / Passed)
 * POST /api/decisions
 */
apiRouter.post('/decisions', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const { dishId, dishTitle, action, mealCost, passReason } = req.body;

    const decision = await prisma.mealDecision.create({
      data: {
        userId: user.id,
        dishId: dishId || 'dish-unknown',
        dishTitle: dishTitle || 'Unknown Dish',
        action: action || 'cooked',
        mealCost: parseFloat(mealCost) || 0,
        passReason: passReason || null,
      },
    });

    res.json({ success: true, decision });
  } catch (error) {
    console.error('[API] /decisions error:', error);
    res.status(500).json({ error: 'Failed to record decision' });
  }
});

/**
 * Get Recent Meal Decisions
 * GET /api/decisions
 */
apiRouter.get('/decisions', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const limit = parseInt(req.query.limit as string) || 20;
    const decisions = await prisma.mealDecision.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(decisions);
  } catch (error) {
    console.error('[API] GET /decisions error:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

/**
 * Pantry Items CRUD
 * GET /api/pantry
 * POST /api/pantry
 */
apiRouter.get('/pantry', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const items = await prisma.pantryItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    console.error('[API] GET /pantry error:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

apiRouter.post('/pantry', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const items = req.body?.items;

    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Please provide items array.' });
      return;
    }

    // Replace user's pantry items cleanly (supports empty array when kitchen is cleared)
    await prisma.pantryItem.deleteMany({
      where: { userId: user.id },
    });

    const validItems = items.filter((item: any) => item && typeof item.name === 'string' && item.name.trim().length > 0);
    if (validItems.length > 0) {
      await prisma.pantryItem.createMany({
        data: validItems.map((item: { name: string; category?: string; quantity?: string }) => ({
          userId: user.id,
          name: item.name.trim(),
          category: item.category || 'pantryStaples',
          quantity: item.quantity || null,
        })),
      });
    }

    res.json({ success: true, count: validItems.length });
  } catch (error) {
    console.error('[API] POST /pantry error:', error);
    res.status(500).json({ error: 'Failed to save pantry items' });
  }
});
