export type UserRole = 'guest' | 'host' | 'admin';

export type ErrorCode =
  | 'validation_error'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'invalid_token'
  | 'rate_limited'
  | 'database_error'
  | 'internal_error';

export class HttpError extends Error {
  statusCode: number;
  code: ErrorCode;
  details?: unknown;
  isOperational: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown, isOperational = true) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
  }
}

export function createHttpError(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
  return new HttpError(statusCode, code, message, details);
}
