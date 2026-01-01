import { Request, Response, NextFunction } from 'express';
import staffUserService from '../../services/staff/user.service';
import { sendSuccess } from '../../utils/response';

class StaffUserController {
  /**
   * Get all users (with status filter)
   * GET /api/staff/users
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await staffUserService.getAllUsers(
        status as string | undefined,
        pageNum,
        limitNum
      );
      sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/staff/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await staffUserService.getUserById(id);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lock user account
   * POST /api/staff/users/:id/lock
   */
  async lockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffId = req.user!.userId;

      if (!reason) {
        res.status(400).json({ message: 'Lock reason is required' });
        return;
      }

      const user = await staffUserService.lockUser(staffId, id, reason);
      sendSuccess(res, user, 'User locked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlock user account
   * POST /api/staff/users/:id/unlock
   */
  async unlockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const staffId = req.user!.userId;

      const user = await staffUserService.unlockUser(staffId, id);
      sendSuccess(res, user, 'User unlocked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user status
   * PATCH /api/staff/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const staffId = req.user!.userId;

      const user = await staffUserService.updateUserStatus(staffId, id, status, reason);
      sendSuccess(res, user, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new StaffUserController();

