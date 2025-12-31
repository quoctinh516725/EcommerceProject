import { Request, Response, NextFunction } from 'express';
import categoryService from '../../services/category.service';
import { sendSuccess } from '../../utils/response';
import { getCache, setCache } from '../../utils/cache';

const CACHE_KEY_CATEGORY_TREE = 'category:tree';
const CACHE_KEY_CATEGORY_SLUG = 'category:slug:';
const CACHE_KEY_CATEGORY_CHILDREN = 'category:children:';
const CACHE_TTL = 3600; // 1 hour

class CategoryController {
  /**
   * GET /categories
   * Get category tree (all active categories in tree structure)
   */
  getCategoryTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Default to activeOnly=true for public routes (can be overridden by query)
      const activeOnly = req.query.activeOnly !== 'false';

      // Try to get from cache (only for active categories)
      if (activeOnly) {
        const cached = await getCache<any>(CACHE_KEY_CATEGORY_TREE);
        if (cached) {
          sendSuccess(res, cached, 'Categories retrieved successfully');
          return;
        }
      }

      const categories = await categoryService.getCategoryTree(activeOnly);

      // Cache the result (only cache active categories)
      if (activeOnly) {
        await setCache(CACHE_KEY_CATEGORY_TREE, categories, CACHE_TTL);
      }

      sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /categories/:slug
   * Get category by slug
   */
  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_CATEGORY_SLUG}${slug}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, 'Category retrieved successfully');
        return;
      }

      const category = await categoryService.getCategoryBySlug(slug);

      // Cache the result
      await setCache(cacheKey, category, CACHE_TTL);

      sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /categories/:id/children
   * Get children of a category
   */
  getCategoryChildren = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Default to activeOnly=true for public routes
      const activeOnly = req.query.activeOnly !== 'false';

      const { id } = req.params;
      const parentId = id === 'root' ? null : id;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_CATEGORY_CHILDREN}${activeOnly ? 'active' : 'all'}:${parentId || 'root'}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        sendSuccess(res, cached, 'Category children retrieved successfully');
        return;
      }

      const children = await categoryService.getCategoryChildren(parentId, activeOnly);

      // Cache the result (only cache active categories)
      if (activeOnly) {
        await setCache(cacheKey, children, CACHE_TTL);
      }

      sendSuccess(res, children, 'Category children retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default new CategoryController();


