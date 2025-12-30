import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../errors/AppError';
import { UserStatus } from '../constants';

class UserController {
  /**
   * GET /admin/users
   * Get all users (with pagination and filters)
   */
  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      // Validate status if provided
      if (status && !Object.values(UserStatus).includes(status as UserStatus)) {
        throw new ValidationError('Invalid status');
      }

      const result = await userService.getUsers({
        status: status as UserStatus,
        search,
        page,
        limit,
      });

      sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /admin/users/:id
   * Get user by ID
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /admin/users/:id/status
   * Update user status
   */
  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(UserStatus).includes(status as UserStatus)) {
        throw new ValidationError('Valid status is required');
      }

      const user = await userService.updateUserStatus(id, { status: status as UserStatus });
      sendSuccess(res, user, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /admin/users/:id
   * Delete user (soft delete - set to INACTIVE)
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();


