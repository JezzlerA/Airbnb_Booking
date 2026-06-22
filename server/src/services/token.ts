import { randomBytes, randomUUID } from 'node:crypto';
import { pool } from '../config/db';
import { env } from '../config/env';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import type { UserRole } from '../utils/http-error';
import { hashPassword } from './password';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export async function createTokenPair(userId: string): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string; expiresIn: number }> {
  const { rows } = await pool.query<AuthenticatedUser>(
    `select id, email, role from users where id = $1`,
    [userId]
  );

  const user = rows[0];

  if (!user) {
    throw new Error('User not found.');
  }

  const refreshToken = randomBytes(32).toString('hex');
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const tokenHash = await hashPassword(refreshToken);

  await pool.query(
    `insert into refresh_tokens (id, user_id, token_hash, expires_at, user_agent)
     values ($1, $2, $3, $4, $5)`,
    [jti, userId, tokenHash, expiresAt, null]
  );

  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(userId, jti),
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS
  };
}

export async function revokeRefreshToken(refreshToken: string, reason = 'logout') {
  const tokenHash = await hashPassword(refreshToken);
  await revokeRefreshTokenHash(tokenHash, reason);
}

export async function revokeRefreshTokenHash(tokenHash: string, reason = 'logout') {
  await pool.query(
    `update refresh_tokens
     set revoked_at = now(), revoked_reason = $2
     where token_hash = $1 and revoked_at is null`,
    [tokenHash, reason]
  );
}
