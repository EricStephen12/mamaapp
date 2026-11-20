import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security Headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
  'exp://localhost:8081',
  process.env.APP_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow native app (no origin) + allowed list
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body Parser (size limit prevents DOS) ────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use(rateLimiter);

// ─── Auth Routes (public) ─────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Public AI Routes (no auth needed — no user-specific data) ───────────────
// Health check, AI generation, and pantry analysis work without a token
import { GroqService } from './services/groq.service.js';
import { ImageService } from './services/image.service.js';
import { VideoService } from './services/video.service.js';

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
    dbConfigured: !!process.env.DATABASE_URL,
  });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, jsonMode, temperature, maxTokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }
    const result = await GroqService.proxyChatCompletion({
      messages,
      jsonMode: Boolean(jsonMode),
      temperature: typeof temperature === 'number' ? temperature : 0.65,
      maxTokens: typeof maxTokens === 'number' ? Math.min(maxTokens, 1200) : 450,
    });
    res.json(result);
  } catch (error) {
    console.error('[API public] /api/ai/chat error:', error);
    res.status(500).json({ error: 'Failed to complete AI chat' });
  }
});

app.post('/api/roll', async (req: Request, res: Response) => {
  try {
    const { timeOfDay, pantryItems, passedTitles, recentCookedTitles, kitchenPass } = req.body;
    const rolled = await GroqService.rollMeal({
      timeOfDay,
      pantryItems: Array.isArray(pantryItems) ? pantryItems : [],
      passedTitles: Array.isArray(passedTitles) ? passedTitles : [],
      recentCookedTitles: Array.isArray(recentCookedTitles) ? recentCookedTitles : [],
      kitchenPass,
    });
    res.json(rolled);
  } catch (error) {
    console.error('[API public] /api/roll error:', error);
    res.status(500).json({ error: 'Failed to roll meal' });
  }
});

app.post('/api/daily-edit', async (req: Request, res: Response) => {
  try {
    const pantryItems = (req.body?.pantryItems as string[]) || ['Eggs', 'Tomatoes', 'Rice', 'Onions'];
    const kitchenPass = req.body?.kitchenPass;
    const dailyEdit = await GroqService.generateDailyEdit(pantryItems, kitchenPass);
    res.json(dailyEdit);
  } catch (error) {
    console.error('[API public] /daily-edit error:', error);
    res.status(500).json({ error: 'Failed to generate daily edit' });
  }
});

app.post('/api/kitchen/analyze', async (req: Request, res: Response) => {
  try {
    const items = (req.body?.items as string[]) || [];
    if (!items.length) { res.status(400).json({ error: 'Provide items array.' }); return; }
    const analysis = await GroqService.analyzePantry(items);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze pantry' });
  }
});

app.post('/api/recipes/generate', async (req: Request, res: Response) => {
  try {
    const ingredients = (req.body?.availableIngredients as string[]) || ['Eggs', 'Tomatoes', 'Rice'];
    const title = req.body?.titleSuggestion as string | undefined;
    const recipe = await GroqService.generateRecipe(ingredients, title);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

app.post('/api/images/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, mealType } = req.body;
    if (!prompt) { res.status(400).json({ error: 'Prompt is required' }); return; }
    const result = await ImageService.generateFoodImage(prompt, mealType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.all(['/api/videos/search', '/api/video/search'], async (req: Request, res: Response) => {
  try {
    const dish = (req.body?.dish || req.query.dish || req.body?.prompt || req.query.prompt || '') as string;
    const ingredients = (req.body?.ingredients as string[]) || undefined;

    if (!dish && (!ingredients || ingredients.length === 0)) {
      res.status(400).json({ error: 'dish name or ingredients required' });
      return;
    }

    const result = await VideoService.searchCookingVideo(dish, ingredients);
    res.json({ success: !!result, video: result });
  } catch (error) {
    console.error('[API public] /api/videos/search error:', error);
    res.status(500).json({ error: 'Failed to search video' });
  }
});

app.post('/api/discover', async (req: Request, res: Response) => {
  try {
    const pantryItems = (req.body?.pantryItems as string[]) || ['Eggs', 'Tomatoes', 'Rice', 'Onions'];
    const kitchenPass = req.body?.kitchenPass;
    const deck = await GroqService.generateDiscoverDeck(pantryItems, kitchenPass);
    res.json({ meals: deck.meals });
  } catch (error) {
    console.error('[API public] /discover error:', error);
    res.status(500).json({ error: 'Failed to generate discover deck' });
  }
});

app.all(['/api/meals/recommendations', '/api/recommendations'], async (req: Request, res: Response) => {
  try {
    const timeLimit = req.query.timeLimit ? parseInt(req.query.timeLimit as string) : 20;
    const gear = (req.query.gear as string) || 'one_pan';
    const cuisine = (req.query.cuisine as string) || 'african_caribbean';
    const deck = await GroqService.generateDiscoverDeck([], {
      timeLimitMinutes: timeLimit,
      cookingGear: gear,
      cuisineAnchor: cuisine,
    } as any);
    res.json(deck.meals);
  } catch (error) {
    console.error('[API public] /api/meals/recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ─── Protected API Routes (auth required — reads/writes user data) ────────────
app.use('/api', requireAuth as express.RequestHandler, apiRouter);

// ─── Root Info ────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    app: 'Mama Kitchen API Backend',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      dailyEdit: 'POST /api/daily-edit',
      analyzePantry: 'POST /api/kitchen/analyze',
      generateRecipe: 'POST /api/recipes/generate',
      generateImage: 'POST /api/images/generate',
      savedMeals: 'GET /api/saved-meals',
      decisions: 'POST /api/decisions',
    },
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`✅ Mama Kitchen Backend running on http://localhost:${PORT}`);
  console.log(`🔒 Auth: JWT (30d expiry) + bcrypt + rate limiting`);
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? 'Connected' : '⚠️ Missing'}`);
  console.log(`🎨 Cloudflare FLUX: ${process.env.CLOUDFLARE_ACCOUNT_ID ? 'Connected' : '⚠️ Missing'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : '⚠️ Missing'}`);
});
