import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../utils/http-error';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

const issuer = 'havenshare-api';
const audience = 'havenshare-web';

export function signAccessToken(user: AccessTokenPayload) {
  return jwt.sign(
    {
      sub: user.sub,
      email: user.email,
      role: user.role
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
      issuer,
      audience
    }
  );
}

export function signRefreshToken(userId: string, jti: string) {
  return jwt.sign(
    {
      sub: userId,
      jti
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
      issuer,
      audience
    }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    issuer,
    audience
  });

  if (typeof payload === 'string' || !payload.sub || !payload.email || !payload.role) {
    throw new Error('Invalid access token payload.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as UserRole
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET, {
    issuer,
    audience
  });

  if (typeof payload === 'string' || !payload.sub || !payload.jti) {
    throw new Error('Invalid refresh token payload.');
  }

  return {
    sub: payload.sub,
    jti: payload.jti
  };
}
