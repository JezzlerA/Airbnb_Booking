import rateLimit from 'express-rate-limit';
import { createHttpError } from '../utils/http-error';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    throw createHttpError(429, 'rate_limited', 'Too many requests. Please retry later.');
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    throw createHttpError(429, 'rate_limited', 'Too many authentication attempts. Please retry later.');
  }
});
