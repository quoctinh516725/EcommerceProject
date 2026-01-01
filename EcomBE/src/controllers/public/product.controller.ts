import { Request, Response, NextFunction } from 'express';
import productService from '../../services/product.service';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../errors/AppError';
import { getCache, setCache } from '../../utils/cache';
import { ProductStatus } from '../../constants';

const CACHE_KEY_PRODUCT_SLUG = 'product:slug:';
const CACHE_KEY_PRODUCT_ID = 'product:id:';
const CACHE_TTL = 1800; // 30 minutes

class ProductController {
  /**
   * GET /products/all
   * Get all products with pagination
   */
  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;
      // Public can only view ACTIVE products
      const productStatus = ProductStatus.ACTIVE;
      

      const { products, total } = await productService.getAllProducts(productStatus, pageNum, limitNum);

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
   * GET /products/:id
   * Get product by ID
   */
  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_PRODUCT_ID}${id}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        // Only return active products
        if (cached.status !== ProductStatus.ACTIVE) {
          throw new NotFoundError('Product not found');
        }
        sendSuccess(res, cached, 'Product retrieved successfully');
        return;
      }

      const product = await productService.getProductById(id);

      // Only return active products
      if (product.status !== ProductStatus.ACTIVE) {
        throw new NotFoundError('Product not found');
      }

      // Cache the result
      await setCache(cacheKey, product, CACHE_TTL);

      sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
  /**
   * GET /products
   * Search and filter products
   */
  searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        q,
        categoryId,
        brandId,
        shopId,
        minPrice,
        maxPrice,
        sortBy,
        page,
        limit,
      } = req.query;

      const searchResult = await productService.searchProducts({
        q: q as string,
        categoryId: categoryId as string,
        brandId: brandId as string,
        shopId: shopId as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        sortBy: sortBy as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      sendSuccess(
        res,
        {
          items: searchResult.hits,
          pagination: {
            page: searchResult.page,
            limit: searchResult.limit,
            total: searchResult.total,
            totalPages: searchResult.totalPages,
          },
        },
        'Products retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /products/:slug
   * Get product by slug (SEO-friendly)
   */
  getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;

      // Try to get from cache
      const cacheKey = `${CACHE_KEY_PRODUCT_SLUG}${slug}`;
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        // Only return active products
        if (cached.status !== ProductStatus.ACTIVE) {
          throw new NotFoundError('Product not found');
        }
        sendSuccess(res, cached, 'Product retrieved successfully');
        return;
      }

      const product = await productService.getProductBySlug(slug);

      // Only return active products
      if (product.status !== ProductStatus.ACTIVE) {
        throw new NotFoundError('Product not found');
      }

      // Cache the result
      await setCache(cacheKey, product, CACHE_TTL);

      sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /products/category/:categoryId
   * Get products by category with pagination
   */
  getProductsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const { page, limit, status } = req.query;

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;
      const productStatus = (status as string) || ProductStatus.ACTIVE;

      // Get products with pagination at database level
      const { products, total } = await productService.getProductsByCategoryId(
        categoryId,
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
   * GET /products/shop/:shopId
   * Get products by shop with pagination
   */
  getProductsByShop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shopId } = req.params;
      const { page, limit, status } = req.query;

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;
      const productStatus = (status as string) || ProductStatus.ACTIVE;

      // Get products with pagination at database level
      const { products, total } = await productService.getProductsByShopId(
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
}

export default new ProductController();

