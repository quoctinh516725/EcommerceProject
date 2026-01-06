import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import userPermissionService from "../services/userPermission.service";
import { RoleCode } from "../constants";

/**
 * Middleware to check if user has a specific permission
 *
 * Uses roleCodes from req.user.roles (trusted Redis cache) instead of querying UserRole table.
 * This eliminates unnecessary joins and improves performance.
 */
export const requirePermission = (permissionCode: string) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has the required permission based on role codes
      // roleCodes come from Redis cache (req.user.roles) which is the source of truth
      const hasPermission = await userPermissionService.hasPermission(
        userRoles,
        permissionCode
      );
      if (!hasPermission) {
        throw new UnauthorizedError(
          `You don't have permission to perform this action`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 *
 * Uses roleCodes from req.user.roles (trusted Redis cache) instead of querying UserRole table.
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has any of the required permissions based on role codes
      const hasAnyPermission = await userPermissionService.hasAnyPermission(
        userRoles,
        permissionCodes
      );
      if (!hasAnyPermission) {
        throw new UnauthorizedError(
          `You don't have permission to perform this action`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 *
 * Uses roleCodes from req.user.roles (trusted Redis cache) instead of querying UserRole table.
 */
export const requireAllPermissions = (permissionCodes: string[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has all of the required permissions based on role codes
      const hasAllPermissions = await userPermissionService.hasAllPermissions(
        userRoles,
        permissionCodes
      );
      if (!hasAllPermissions) {
        throw new UnauthorizedError(
          `You don't have permission to perform this action`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has a specific role
 *
 * Uses roleCodes from req.user.roles (trusted Redis cache) - no database query needed.
 */
export const requireRole = (roleCode: string) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has the required role from token (no DB query needed)
      if (!userRoles.includes(roleCode)) {
        throw new UnauthorizedError(
          `You don't have the required role to perform this action`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the specified roles
 *
 * Uses roleCodes from req.user.roles (trusted Redis cache) - no database query needed.
 */
export const requireAnyRole = (roleCodes: string[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const userRoles = req.user.roles || [];

      // Check if user has ADMIN role from token (fast check, no DB query)
      if (userRoles.includes(RoleCode.ADMIN)) {
        return next();
      }

      // Check if user has any of the required roles from token (no DB query needed)
      const hasAnyRole = roleCodes.some((roleCode) =>
        userRoles.includes(roleCode)
      );
      if (!hasAnyRole) {
        throw new UnauthorizedError(
          `You don't have the required role to perform this action`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
