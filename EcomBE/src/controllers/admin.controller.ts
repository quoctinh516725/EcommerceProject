import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import { sendSuccess } from "../utils/response";

class AdminController {
  /**
   * Get system settings
   * GET /api/admin/settings
   */
  async getSystemSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.getSystemSettings();
      sendSuccess(res, settings, "System settings retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update system setting
   * PUT /api/admin/settings
   */
  async updateSystemSetting(req: Request, res: Response, next: NextFunction) {
    try {
      // Expecting { key: string, value: string, description?: string }
      const { key, value, description } = req.body;
      const adminId = req.user!.userId;

      if (!key || value === undefined) {
        res.status(400).json({ message: "Key and value are required" });
        return;
      }

      const setting = await adminService.updateSystemSetting(adminId, {
        key,
        value,
        description,
      });
      sendSuccess(res, setting, "System setting updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, userId, action, resource, startDate, endDate } =
        req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const filters = {
        userId: userId as string,
        action: action as string,
        resource: resource as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await adminService.getAuditLogs(
        filters,
        pageNum,
        limitNum
      );
      sendSuccess(res, result, "Audit logs retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteSystemSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const adminId = req.user!.userId;

      const setting = await adminService.deleteSystemSetting(adminId, key);
      sendSuccess(res, setting, "System setting deleted successfully");
    } catch (error) {
      next(error);
    }
  }

}

export default new AdminController();
