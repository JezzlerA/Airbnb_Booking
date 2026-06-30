import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(20),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_ADMIN_PASSWORD: z.string().default('Admin123!'),
  APP_PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  PAYMENT_CURRENCY: z.string().length(3).default('PHP'),
  PAYMENT_GATEWAY: z.enum(['paymongo', 'xendit', 'mock']).default('paymongo'),
  PAYMONGO_SECRET_KEY: z.string().optional(),
  PAYMONGO_WEBHOOK_SECRET: z.string().optional(),
  XENDIT_SECRET_KEY: z.string().optional(),
  XENDIT_WEBHOOK_SECRET: z.string().optional()
});

export const env = envSchema.parse(process.env);
