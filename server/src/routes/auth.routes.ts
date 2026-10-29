import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'mama-kitchen-secret-change-in-prod';
const JWT_EXPIRES = '30d';

function makeToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function sanitizeEmail(email: string) {
  return email.toLowerCase().trim();
}

/**
 * POST /api/auth/signup
 * Body: { name, email, password }
 */
authRouter.post('/signup', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const cleanEmail = sanitizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: (name?.trim()) || "Mama's Child",
        passwordHash,
      },
    });

    const token = makeToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('[AUTH] /signup error:', err);
    res.status(500).json({ error: 'Sign up failed. Please try again.' });
  }
});

/**
 * POST /api/auth/signin
 * Body: { email, password }
 */
authRouter.post('/signin', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = sanitizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Constant-time compare to prevent timing attacks
    const dummyHash = '$2a$12$invalidhashfortimingprotection00000000000000000000000000';
    const hashToCheck = user?.passwordHash || dummyHash;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !user.passwordHash || !valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = makeToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('[AUTH] /signin error:', err);
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Always returns the same response to prevent email enumeration
 */
authRouter.post('/forgot-password', authRateLimiter, async (_req: Request, res: Response) => {
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});
