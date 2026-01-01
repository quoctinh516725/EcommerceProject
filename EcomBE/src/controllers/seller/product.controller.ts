import { Request, Response, NextFunction } from 'express';
import sellerProductService from '../../services/seller/product.service';
import { sendSuccess } from '../../utils/response';

class SellerProductController {
  /**
   * GET /api/seller/products
   * Get my products with pagination
   */
  getMyProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const shopId = req.shop!.id; // From requireShop middleware
      const { page, limit, status } = req.query;

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;
      const productStatus = status as string | undefined;

      const { products, total } = await sellerProductService.getMyProducts(
        userId,
        shopId,
        productStatus,
        pageNum,
        limitNum
      );

      sendSuccess(
        res,
        {
          items: products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        'Products retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/seller/products/:id
   * Get my product by ID
   */
  getMyProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Product ownership already verified by requireProductOwnership middleware
      const product = req.product!;
      sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/seller/products
   * Create product
   */
  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const shopId = req.shop!.id; // From requireShop middleware
      const product = await sellerProductService.createProduct(userId, shopId, req.body);
      sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/seller/products/:id
   * Update my product
   */
  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      // Product ownership already verified by requireProductOwnership middleware
      const product = await sellerProductService.updateProduct(userId, id, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/seller/products/:id
   * Delete my product
   */
  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      // Product ownership already verified by requireProductOwnership middleware
      await sellerProductService.deleteProduct(userId, id);
      sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/seller/products/:id/status
   * Update product status
   */
  updateProductStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { status } = req.body;
      // Product ownership already verified by requireProductOwnership middleware
      const product = await sellerProductService.updateProductStatus(userId, id, status);
      sendSuccess(res, product, 'Product status updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default new SellerProductController();

