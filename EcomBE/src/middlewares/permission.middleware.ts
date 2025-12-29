import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import userPermissionService from '../services/userPermission.service';
import { RoleCode } from '../constants';

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const userId = req.user.userId;
      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has the required permission
      const hasPermission = await userPermissionService.hasPermission(userId, permissionCode);
      if (!hasPermission) {
        throw new UnauthorizedError(`You don't have permission to perform this action`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const userId = req.user.userId;
      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = await userPermissionService.hasAnyPermission(userId, permissionCodes);
      if (!hasAnyPermission) {
        throw new UnauthorizedError(`You don't have permission to perform this action`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 */
export const requireAllPermissions = (permissionCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const userId = req.user.userId;
      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has all of the required permissions
      const hasAllPermissions = await userPermissionService.hasAllPermissions(userId, permissionCodes);
      if (!hasAllPermissions) {
        throw new UnauthorizedError(`You don't have permission to perform this action`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has a specific role
 */
export const requireRole = (roleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const userId = req.user.userId;
      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has the required role from token
      if (!userRoles.includes(roleCode)) {
        throw new UnauthorizedError(`You don't have the required role to perform this action`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the specified roles
 */
export const requireAnyRole = (roleCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const userId = req.user.userId;
      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has any of the required roles from token
      const hasAnyRole = roleCodes.some((roleCode) => userRoles.includes(roleCode));
      if (!hasAnyRole) {
        throw new UnauthorizedError(`You don't have the required role to perform this action`);
      }
    } catch (error) {
      next(error);
    }
  };
};



