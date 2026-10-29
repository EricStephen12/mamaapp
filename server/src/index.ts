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

// ─── Protected API Routes ─────────────────────────────────────────────────────
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
