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

    const savedMeal = await prisma.savedMeal.create({
      data: {
        userId: user.id,
        mealId: mealId || `meal-${Date.now()}`,
        title,
        type,
        cookTime,
        cost,
        costNumeric: Number(costNumeric) || 2.5,
        imageUrl: imageUrl || null,
        recipeSteps: Array.isArray(recipeSteps) ? recipeSteps : [],
        ingredients: ingredients ? (typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients) : undefined,
        spotName: spotName || null,
        vibe: vibe || null,
      },
    });

    res.json({ success: true, meal: savedMeal });
  } catch (error) {
    console.error('[API] POST /saved-meals error:', error);
    res.status(500).json({ error: 'Failed to save meal to database' });
  }
});

/**
 * Remove Saved Meal from Neon DB
 * DELETE /api/saved-meals/:id
 */
apiRouter.delete('/saved-meals/:id', async (req: Request, res: Response) => {
  try {
    const user = await getTargetUser(req);
    const { id } = req.params;

    await prisma.savedMeal.deleteMany({
      where: {
        id: id as string,
        userId: user.id,
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

    if (action === 'cooked' && mealCost > 0) {
      await prisma.user.update({
        where: { id: user.id },
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
    const items = (req.body?.items as Array<{ name: string; category?: string; quantity?: string }>) || [];

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Please provide items array.' });
      return;
    }

    // Replace or add pantry items
    const created = await Promise.all(
      items.map((item) =>
        prisma.pantryItem.create({
          data: {
            userId: user.id,
            name: item.name,
            category: item.category || 'pantryStaples',
            quantity: item.quantity || null,
          },
        })
      )
    );

    res.json({ success: true, count: created.length });
  } catch (error) {
    console.error('[API] POST /pantry error:', error);
    res.status(500).json({ error: 'Failed to save pantry items' });
  }
});
