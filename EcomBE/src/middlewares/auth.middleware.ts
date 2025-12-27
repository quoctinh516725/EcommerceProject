import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../utils/blacklist';
import { UnauthorizedError } from '../errors/AppError';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Authentication middleware
 * Verifies access token and checks blacklist
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
};

/**
 * Optional authentication middleware
 * Doesn't throw error if no token, just sets req.user if token is valid
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check blacklist
      const isBlacklisted = await isTokenBlacklisted(token);
      if (!isBlacklisted) {
        try {
          const decoded = verifyAccessToken(token);
          req.user = decoded;
        } catch (error) {
          // Ignore invalid token in optional auth
        }
      }
    }
    
    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};

