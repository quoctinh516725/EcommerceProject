import { Response } from 'express';
import { env } from '../config/env';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Set refresh token in HTTP-only cookie
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  const isProduction = env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true, // Chỉ server đọc được, JavaScript không thể truy cập
    secure: isProduction, // Chỉ gửi qua HTTPS trong production
    sameSite: 'strict', // Chống CSRF attacks
    maxAge, // 7 days
    path: '/api/auth', // Chỉ gửi cookie cho các route auth
  });
};

/**
 * Clear refresh token cookie
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
};

/**
 * Get refresh token cookie name (for reading in controllers)
 */
export const getRefreshTokenCookieName = (): string => {
  return REFRESH_TOKEN_COOKIE_NAME;
};

