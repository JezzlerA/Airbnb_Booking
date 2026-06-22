import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'not_found', `Route not found: ${req.method} ${req.originalUrl}`));
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    _next(err);
    return;
  }

  if (err instanceof HttpError) {
    const response = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    };

    res.status(err.statusCode).json(response);
    return;
  }

  console.error(JSON.stringify({
    method: req.method,
    path: req.originalUrl,
    statusCode: 500,
    code: 'internal_error',
    stack: err instanceof Error ? err.stack : undefined
  }));

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: env.NODE_ENV === 'production' ? 'Internal server error.' : (err instanceof Error ? err.message : 'Internal server error.'),
      details: env.NODE_ENV === 'production' ? undefined : err
    }
  });
};
