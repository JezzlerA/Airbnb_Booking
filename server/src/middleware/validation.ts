import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { createHttpError } from '../utils/http-error';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(createHttpError(400, 'validation_error', 'Validation failed.', result.error.flatten()));
      return;
    }

    req.body = result.data;
    next();
  };
}
