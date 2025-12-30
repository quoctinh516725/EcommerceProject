import { Request, Response, NextFunction } from 'express';
import permissionService from '../services/permission.service';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../errors/AppError';

class PermissionController {
  /**
   * GET /admin/permissions
   * Get all permissions
   */
  getAllPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await permissionService.getAllPermissions();
      sendSuccess(res, permissions, 'Permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /admin/permissions/:id
   * Get permission by ID
   */
  getPermissionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const permission = await permissionService.getPermissionById(id);
      sendSuccess(res, permission, 'Permission retrieved successfully');
    } catch (error) {
      next(error);
    }
  };


  /**
   * POST /admin/permissions
   * Create new permission
   */
  createPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, description } = req.body;

      if (!code) {
        throw new ValidationError('Code is required');
      }

      const permission = await permissionService.createPermission({
        code,
        description,
      });

      sendSuccess(res, permission, 'Permission created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /admin/permissions/:id
   * Update permission
   */
  updatePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { description } = req.body;

      const permission = await permissionService.updatePermission(id, {
        description,
      });

      sendSuccess(res, permission, 'Permission updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /admin/permissions/:id
   * Delete permission
   */
  deletePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await permissionService.deletePermission(id);
      sendSuccess(res, null, 'Permission deleted successfully');
    } catch (error) {
      next(error);
    }
  };

}

export default new PermissionController();


