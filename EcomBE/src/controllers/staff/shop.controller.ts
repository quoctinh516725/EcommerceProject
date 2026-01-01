import { Request, Response, NextFunction } from 'express';
import staffShopService from '../../services/staff/shop.service';
import { sendSuccess } from '../../utils/response';

class StaffShopController {
  /**
   * Get shops pending approval
   * GET /api/staff/shops/pending
   */
  async getPendingShops(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await staffShopService.getPendingShops(pageNum, limitNum);
      sendSuccess(res, result, 'Pending shops retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all shops (with status filter)
   * GET /api/staff/shops
   */
  async getAllShops(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await staffShopService.getAllShops(
        status as string | undefined,
        pageNum,
        limitNum
      );
      sendSuccess(res, result, 'Shops retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get shop by ID
   * GET /api/staff/shops/:id
   */
  async getShopById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shop = await staffShopService.getShopById(id);
      sendSuccess(res, shop, 'Shop retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review shop approval (approve or reject)
   * POST /api/staff/shops/:id/approve
   */
  async reviewShopApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const staffId = req.user!.userId;
      const { status, reason } = req.body;

      const shop = await staffShopService.reviewShopApproval(staffId, { shopId: id, status, reason });
      sendSuccess(res, shop, 'Shop approval reviewed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend shop
   * POST /api/staff/shops/:id/suspend
   */
  async bannedShop(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffId = req.user!.userId;

      if (!reason) {
        res.status(400).json({ message: 'Suspension reason is required' });
        return;
      }

      const shop = await staffShopService.bannedShop(staffId, id, reason);
      sendSuccess(res, shop, 'Shop suspended successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate shop
   * POST /api/staff/shops/:id/activate
   */
  async activateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const staffId = req.user!.userId;

      const shop = await staffShopService.activateShop(staffId, id);
      sendSuccess(res, shop, 'Shop activated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update shop status
   * PATCH /api/staff/shops/:id/status
   */
  async updateShopStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const staffId = req.user!.userId;

      const shop = await staffShopService.updateShopStatus(staffId, id, status, reason);
      sendSuccess(res, shop, 'Shop status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new StaffShopController();

