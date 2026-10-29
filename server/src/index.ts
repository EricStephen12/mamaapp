import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.routes.js';
import { authRouter } from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRouter);

// Main API Router
app.use('/api', apiRouter);

// Fallback route
app.get('/', (_req, res) => {
  res.json({
    app: 'Mama Kitchen API Backend',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      dailyEdit: 'POST /api/daily-edit',
      analyzePantry: 'POST /api/kitchen/analyze',
      generateRecipe: 'POST /api/recipes/generate',
      generateImage: 'POST /api/images/generate',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Mama Kitchen Backend running on http://localhost:${PORT}`);
  console.log(`Groq API: ${process.env.GROQ_API_KEY ? 'Connected' : 'Missing (using local intelligent fallback)'}`);
  console.log(`Flux Image Provider: ${process.env.FAL_KEY ? 'Fal.ai (Active)' : process.env.TOGETHER_API_KEY ? 'Together AI (Active)' : 'Curated CDN Caching'}`);
});
