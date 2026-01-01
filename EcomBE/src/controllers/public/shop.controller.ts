import { Request, Response, NextFunction } from 'express';
import shopService from '../../services/shop.service';
import { sendSuccess } from '../../utils/response';
import { getCache, setCache } from '../../utils/cache';

const CACHE_KEY_SHOP_ID = 'shop:id:';
const CACHE_KEY_SHOP_SLUG = 'shop:slug:';
const CACHE_TTL = 1800; // 30 minutes

class ShopController {
  /**
   * GET /shops/:id
   * Get shop by ID
   */
  getShopById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_SHOP_ID}${id}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, 'Shop retrieved successfully');
        return;
      }

      const shop = await shopService.getShopById(id);

      // Cache the result
      await setCache(cacheKey, shop, CACHE_TTL);

      sendSuccess(res, shop, 'Shop retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /shops/:slug
   * Get shop by slug (SEO-friendly)
   */
  getShopBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_SHOP_SLUG}${slug}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, 'Shop retrieved successfully');
        return;
      }

      const shop = await shopService.getShopBySlug(slug);

      // Cache the result
      await setCache(cacheKey, shop, CACHE_TTL);

      sendSuccess(res, shop, 'Shop retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /shops/:id/products
   * Get shop products with pagination
   */
  getShopProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { page, limit, status } = req.query;

      const result = await shopService.getShopProducts(id, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        status: (status as string) || 'ACTIVE',
      });

      sendSuccess(
        res,
        {
          items: result.items,
          pagination: result.pagination,
        },
        'Shop products retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new ShopController();


