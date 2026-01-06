import { Request, Response, NextFunction } from "express";
import brandService from "../../services/brand.service";
import { sendSuccess } from "../../utils/response";
import { getCache, setCache } from "../../utils/cache";

const CACHE_KEY_BRANDS = "brands:all";
const CACHE_KEY_BRAND_SLUG = "brand:slug:";
const CACHE_TTL = 3600; // 1 hour

class BrandController {
  /**
   * GET /brands
   * Get all brands
   */
  getAllBrands = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Try to get from cache
      const cached = await getCache<any>(CACHE_KEY_BRANDS);
      if (cached) {
        sendSuccess(res, cached, "Brands retrieved successfully");
        return;
      }

      const brands = await brandService.getAllBrands();

      // Cache the result
      await setCache(CACHE_KEY_BRANDS, brands, CACHE_TTL);

      sendSuccess(res, brands, "Brands retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /brands/:slug
   * Get brand by slug
   */
  getBrandBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_BRAND_SLUG}${slug}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, "Brand retrieved successfully");
        return;
      }

      const brand = await brandService.getBrandBySlug(slug);

      // Cache the result
      await setCache(cacheKey, brand, CACHE_TTL);

      sendSuccess(res, brand, "Brand retrieved successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default new BrandController();
