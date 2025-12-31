import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  username?: string;
  roles?: string[]; // Array of role codes
  shopId?: string; // Shop ID if user is a seller
}

export interface DecodedToken {
  userId: string;
  email: string;
  username?: string;
  roles?: string[]; // Array of role codes
  shopId?: string; // Shop ID if user is a seller
  iat?: number;
  exp?: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = env.JWT_ACCESS_SECRET as string;
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN || '15m';
  
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const secret = env.JWT_REFRESH_SECRET as string;
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  return jwt.sign({ userId }, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
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

