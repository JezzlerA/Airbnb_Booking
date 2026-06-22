import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../utils/http-error';
import { createHttpError } from '../utils/http-error';
import { verifyAccessToken } from '../utils/jwt';

function extractBearerToken(req: Request) {
  const header = req.header('authorization');

  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      next(createHttpError(401, 'unauthorized', 'Authentication required.'));
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch {
    next(createHttpError(401, 'invalid_token', 'Invalid or expired access token.'));
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      next(createHttpError(401, 'unauthorized', 'Authentication required.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(createHttpError(403, 'forbidden', 'Insufficient permissions.'));
      return;
    }

    next();
  };
}
