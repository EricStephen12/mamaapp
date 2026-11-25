import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import { EmailService } from '../services/email.service.js';

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

    // Send welcome email via Resend (fire-and-forget)
    EmailService.sendWelcomeEmail(cleanEmail, user.name).catch((emailErr) => {
      console.warn('[AUTH] Welcome email send error (non-fatal):', emailErr);
    });

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
 * Sends password reset code via Resend if email exists, and returns consistent response
 */
authRouter.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const cleanEmail = sanitizeEmail(email);
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user) {
        // Generate random 6-digit verification code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Send email via Resend
        EmailService.sendPasswordResetEmail(cleanEmail, resetCode).catch((err) => {
          console.warn('[AUTH] Forgot-password email error:', err);
        });
      }
    }
  } catch (err) {
    console.warn('[AUTH] /forgot-password handled error:', err);
  }
  res.json({ message: 'If that email exists, a reset code has been sent.' });
});

/**
 * DELETE /api/auth/account
 * Deletes current authenticated user and cascades to all related records
 */
authRouter.delete('/account', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await prisma.user.delete({
      where: { id: userId },
    });
    res.json({ success: true, message: 'Account and associated data deleted permanently.' });
  } catch (err) {
    console.error('[AUTH] /account DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * POST /api/auth/delete-account-web
 * Public web portal endpoint required by Google Play Data Safety so users can
 * permanently delete their account and cascaded data without reinstalling the app.
 */
authRouter.post('/delete-account-web', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required to verify account ownership.' });
      return;
    }

    const cleanEmail = sanitizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    const dummyHash = '$2a$12$invalidhashfortimingprotection00000000000000000000000000';
    const hashToCheck = user?.passwordHash || dummyHash;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !user.passwordHash || !valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    res.json({
      success: true,
      message: 'Your Mama Dish account and all associated data have been permanently deleted.',
    });
  } catch (err) {
    console.error('[AUTH] /delete-account-web error:', err);
    res.status(500).json({ error: 'Failed to process account deletion. Please try again.' });
  }
});
