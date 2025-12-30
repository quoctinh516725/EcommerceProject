import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import {
  validateRegister,
  validateLogin,
} from '../validators/auth.validator';
import { sendSuccess } from '../utils/response';
import { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenCookieName } from '../utils/cookie';
import { UnauthorizedError } from '../errors/AppError';

class AuthController {
  /**
   * POST /auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateRegister(req.body);
      const result = await authService.register(input);
      
      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(res, result.refreshToken);
      
      // Return only access token and user info (not refresh token)
      const { refreshToken, ...responseData } = result;
      
      sendSuccess(res, responseData, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateLogin(req.body);
      const result = await authService.login(input);
      
      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(res, result.refreshToken);
      
      // Return only access token and user info (not refresh token)
      const { refreshToken, ...responseData } = result;
      
      sendSuccess(res, responseData, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from cookie instead of body
      const cookieName = getRefreshTokenCookieName();
      const refreshToken = req.cookies[cookieName];
      
      if (!refreshToken) {
        return next(new UnauthorizedError('Refresh token not found in cookie'));
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from cookie
      const cookieName = getRefreshTokenCookieName();
      const refreshToken = req.cookies[cookieName];
      
      // Get access token from header
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      
      if (refreshToken) {
        await authService.logout(refreshToken, accessToken);
      }
      
      // Clear refresh token cookie
      clearRefreshTokenCookie(res);
      
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();

