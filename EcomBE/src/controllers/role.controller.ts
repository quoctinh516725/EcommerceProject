import { Request, Response, NextFunction } from 'express';
import roleService from '../services/role.service';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../errors/AppError';
import { RoleStatus } from '../constants';

class RoleController {
  /**
   * GET /admin/roles
   * Get all roles
   */
  getAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      if (status !== undefined) {
        if (!Object.values(RoleStatus).includes(status as RoleStatus)) {
          throw new ValidationError('Invalid status');
        }
      }
      
      const roles = await roleService.getAllRoles(status as any);
      sendSuccess(res, roles, 'Roles retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /admin/roles/:id
   * Get role by ID
   */
  getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      sendSuccess(res, role, 'Role retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /admin/roles
   * Create new role
   */
  createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, name, description, status } = req.body;

      if (!code || !name) {
        throw new ValidationError('Code and name are required');
      }

      const role = await roleService.createRole({
        code,
        name,
        description,
        status,
      });

      sendSuccess(res, role, 'Role created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /admin/roles/:id
   * Update role
   */
  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;

      const role = await roleService.updateRole(id, {
        name,
        description,
        status,
      });

      sendSuccess(res, role, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /admin/roles/:id
   * Delete role (soft delete - set to INACTIVE)
   */
  deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await roleService.deleteRole(id);
      sendSuccess(res, null, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /admin/roles/:id/activate
   * Activate role
   */
  activateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await roleService.activateRole(id);
      sendSuccess(res, role, 'Role activated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /admin/roles/:id/deactivate
   * Deactivate role
   */
  deactivateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await roleService.deactivateRole(id);
      sendSuccess(res, role, 'Role deactivated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /admin/roles/:id/permissions
   * Get role permissions
   */
  getRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const permissions = await roleService.getRolePermissions(id);
      sendSuccess(res, permissions, 'Role permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /admin/roles/:roleCode/permissions/:permissionCode
   * Assign permission to role
   */
  assignPermissionToRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { roleCode, permissionCode } = req.params;
      await roleService.assignPermissionToRole(roleCode, permissionCode);
      sendSuccess(res, null, 'Permission assigned to role successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /admin/roles/:roleCode/permissions/:permissionCode
   * Remove permission from role
   */
  removePermissionFromRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { roleCode, permissionCode } = req.params;
      await roleService.removePermissionFromRole(roleCode, permissionCode);
      sendSuccess(res, null, 'Permission removed from role successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /admin/users/:userId/roles/:roleCode
   * Assign role to user
   */
  assignRoleToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, roleCode } = req.params;
      await roleService.assignRoleToUser(userId, roleCode);
      sendSuccess(res, null, 'Role assigned to user successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /admin/users/:userId/roles/:roleCode
   * Remove role from user
   */
  removeRoleFromUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, roleCode } = req.params;
      await roleService.removeRoleFromUser(userId, roleCode);
      sendSuccess(res, null, 'Role removed from user successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /admin/users/:userId/roles
   * Get user roles
   */
  getUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const roles = await roleService.getUserRoles(userId);
      sendSuccess(res, roles, 'User roles retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default new RoleController();


