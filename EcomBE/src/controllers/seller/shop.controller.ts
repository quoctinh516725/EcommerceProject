import { Request, Response, NextFunction } from 'express';
import sellerShopService from '../../services/seller/shop.service';
import { sendSuccess } from '../../utils/response';

class SellerShopController {
  /**
   * GET /api/seller/shop
   * Get my shop
   */
  getMyShop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const shop = await sellerShopService.getMyShop(userId);
      sendSuccess(res, shop, 'Shop retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/seller/shop
   * Create shop
   */
  createShop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const shop = await sellerShopService.createShop(userId, req.body);
      sendSuccess(res, shop, 'Shop created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/seller/shop
   * Update my shop
   */
  updateShop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      // Shop ownership already verified by requireShop middleware
      const shop = await sellerShopService.updateShop(userId, req.body);
      sendSuccess(res, shop, 'Shop updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/seller/shop/status
   * Update shop status (ACTIVE/INACTIVE only)
   */
  updateShopStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { status } = req.body;
      // Shop ownership already verified by requireShop middleware
      const shop = await sellerShopService.updateShopStatus(userId, status);
      sendSuccess(res, shop, 'Shop status updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default new SellerShopController();

