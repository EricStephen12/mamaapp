import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mama-kitchen-secret-change-in-prod';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * requireAuth middleware — validates JWT and attaches userId to req.
 * Returns 401 if token is missing, expired, or tampered.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Allow health check to pass through for cloud hosting probes (Render, etc.)
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    // Lightweight existence check — prevents deleted users from using old tokens
    const exists = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!exists) {
      res.status(401).json({ error: 'Account not found.' });
      return;
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
