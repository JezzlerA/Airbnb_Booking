import { z } from 'zod';
import { pool } from '../config/db';
import { createHttpError, type UserRole } from '../utils/http-error';
import { verifyRefreshToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from './password';
import { createTokenPair, revokeRefreshToken, revokeRefreshTokenHash } from './token';

export const registerUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(['guest', 'host']).default('guest')
});

export const registerAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(['Super Admin', 'Manager']).default('Super Admin')
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export async function registerUser(input: RegisterUserInput) {
  const passwordHash = await hashPassword(input.password);

  const { rows, rowCount } = await pool.query(
    `insert into users (name, email, password_hash, phone, role)
     values ($1, $2, $3, $4, $5)
     returning id, email, name, phone, avatar_url, role, verified, created_at`,
    [input.name, input.email, passwordHash, input.phone ?? null, input.role]
  );

  if (rowCount !== 1) {
    throw createHttpError(500, 'database_error', 'Unable to create user.');
  }

  const user = rows[0];
  const tokens = await createTokenPair(user.id);

  return {
    user: {
      ...user,
      role: user.role as UserRole
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn
  };
}

export async function registerAdmin(input: RegisterAdminInput) {
  const passwordHash = await hashPassword(input.password);
  const dbRole = input.role === 'Manager' ? 'host' : 'admin';

  const { rows, rowCount } = await pool.query(
    `insert into users (name, email, password_hash, role, verified)
     values ($1, $2, $3, $4, true)
     returning id, email, name, phone, avatar_url, role, verified, created_at`,
    [input.name, input.email, passwordHash, dbRole]
  );

  if (rowCount !== 1) {
    throw createHttpError(500, 'database_error', 'Unable to create admin account.');
  }

  const user = rows[0];
  const tokens = await createTokenPair(user.id);

  return {
    user: {
      ...user,
      role: input.role
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn
  };
}

export async function loginUser(input: LoginInput) {
  const { rows } = await pool.query(
    `select id, email, name, phone, avatar_url, role, password_hash, verified, created_at
     from users
     where email = $1`,
    [input.email]
  );

  const user = rows[0];

  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw createHttpError(401, 'unauthorized', 'Invalid email or password.');
  }

  const tokens = await createTokenPair(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      role: user.role as UserRole,
      verified: user.verified,
      createdAt: user.created_at
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn
  };
}

export async function getMe(userId: string) {
  const { rows } = await pool.query(
    `select id, email, name, phone, avatar_url, role, verified, created_at
     from users
     where id = $1`,
    [userId]
  );

  const user = rows[0];

  if (!user) {
    throw createHttpError(404, 'not_found', 'User not found.');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: user.role as UserRole,
    verified: user.verified,
    createdAt: user.created_at
  };
}

export async function refreshTokens(refreshToken: string) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createHttpError(401, 'invalid_token', 'Invalid refresh token.');
  }

  const { rows } = await pool.query(
    `select id, user_id, token_hash, expires_at, revoked_at
     from refresh_tokens
     where id = $1 and user_id = $2 and revoked_at is null and expires_at > now()
     for update`,
    [payload.jti, payload.sub]
  );

  const storedToken = rows[0];

  if (!storedToken) {
    throw createHttpError(401, 'invalid_token', 'Refresh token has expired or been revoked.');
  }

  const tokenMatches = await verifyPassword(refreshToken, storedToken.token_hash);

  if (!tokenMatches) {
    await pool.query(
      `update refresh_tokens
       set revoked_at = now(), revoked_reason = 'reuse_detected'
       where user_id = $1`,
      [payload.sub]
    );
    throw createHttpError(401, 'invalid_token', 'Refresh token reuse detected.');
  }

  const newTokens = await createTokenPair(payload.sub);
  await revokeRefreshTokenHash(storedToken.token_hash, 'rotated');

  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    expiresIn: newTokens.expiresIn
  };
}

export async function logout(refreshToken: string) {
  await revokeRefreshToken(refreshToken, 'logout');
  return { success: true };
}
