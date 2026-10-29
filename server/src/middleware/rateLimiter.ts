import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

const ipMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * For production with multiple instances, swap for redis-based limiter.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  next();
}

/**
 * Stricter limiter for auth endpoints — 10 per minute per IP.
 */
const authMap = new Map<string, { count: number; resetAt: number }>();

export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const entry = authMap.get(ip);

  if (!entry || now > entry.resetAt) {
    authMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > 10) {
    res.status(429).json({ error: 'Too many sign-in attempts. Please wait a minute.' });
    return;
  }

  next();
}
