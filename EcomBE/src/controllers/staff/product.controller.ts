import { Request, Response, NextFunction } from 'express';
import staffProductService from '../../services/staff/product.service';
import { sendSuccess } from '../../utils/response';

class StaffProductController {
  /**
   * Get products pending approval
   * GET /api/staff/products/pending
   */
  async getPendingProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await staffProductService.getPendingProducts(pageNum, limitNum);
      sendSuccess(res, result, 'Pending products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all products (with status filter)
   * GET /api/staff/products
   */
  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await staffProductService.getAllProducts(
        status as string | undefined,
        pageNum,
        limitNum
      );
      sendSuccess(res, result, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * GET /api/staff/products/:id
   */
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await staffProductService.getProductById(id);
      sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review product approval (approve or reject)
   * POST /api/staff/products/:id/approve
   */
  async reviewProductApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const staffId = req.user!.userId; 

      const product = await staffProductService.reviewProductApproval(staffId, {
        productId: id,
        status,
        reason,
      });
      sendSuccess(res, product, 'Product approval reviewed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ban product
   * POST /api/staff/products/:id/ban
   */
  async banProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffId = req.user!.userId;

      if (!reason) {
        res.status(400).json({ message: 'Reason is required' });
        return;
      }

      const product = await staffProductService.banProduct(staffId, id, reason);
      sendSuccess(res, product, 'Product banned successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new StaffProductController();

