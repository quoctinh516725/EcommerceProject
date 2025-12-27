import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  username?: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  username?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN;
  
  return jwt.sign(payload, env.JWT_ACCESS_SECRET!, {
    expiresIn,
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET!, {
    expiresIn,
  });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string; exp?: number } => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET!) as { userId: string; exp?: number };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification (to get expiration time)
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.decode(token) as DecodedToken | null;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Get remaining time until token expires (in seconds)
 */
export const getTokenRemainingTime = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const remainingTime = decoded.exp - currentTime;
  
  return remainingTime > 0 ? remainingTime : 0;
};

