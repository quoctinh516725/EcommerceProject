import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateLogout,
} from '../validators/auth.validator';
import { sendSuccess } from '../utils/response';

class AuthController {
  /**
   * POST /auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateRegister(req.body);
      const result = await authService.register(input);
      
      sendSuccess(res, result, 'Registration successful', 201);
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
      
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateRefreshToken(req.body);
      const result = await authService.refreshToken(input.refreshToken);
      
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
      const input = validateLogout(req.body);
      
      // Get access token from header if not in body
      const authHeader = req.headers.authorization;
      const accessToken = input.accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined);
      
      await authService.logout(input.refreshToken, accessToken);
      
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();

