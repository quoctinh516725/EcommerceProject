import { Request, Response, NextFunction } from 'express';
import shopRepository from '../repositories/shop.repository';
import productRepository from '../repositories/product.repository';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

// Extend Express Request to include shop and product
declare global {
  namespace Express {
    interface Request {
      shop?: any;
      product?: any;
      shopId?: string;
    }
  }
}

/**
 * Middleware to check if user owns a shop
 * Uses shopId from token/cache to avoid DB query
 */
export const requireShopOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      throw new ForbiddenError('Authentication required');
    }

    const userId = req.user.userId;
    const shopIdFromToken = req.user.shopId;
    const shopIdFromParam = req.params.shopId || req.body.shopId || req.params.id;

    // If shopId is in token, use it directly (no DB query)
    if (shopIdFromToken && shopIdFromParam) {
      if (shopIdFromToken !== shopIdFromParam) {
        throw new ForbiddenError('You do not own this shop');
      }
      // Verify shop exists and belongs to user (one-time verification)
      const shop = await shopRepository.findById(shopIdFromToken);
      if (!shop) {
        throw new NotFoundError('Shop not found');
      }
      if (shop.sellerId !== userId) {
        throw new ForbiddenError('You do not own this shop');
      }
      req.shop = shop;
      return next();
    }

    // If no shopId in token but user is seller, get shop from DB
    if (!shopIdFromToken && shopIdFromParam) {
      const shop = await shopRepository.findById(shopIdFromParam);
      if (!shop) {
        throw new NotFoundError('Shop not found');
      }
      if (shop.sellerId !== userId) {
        throw new ForbiddenError('You do not own this shop');
      }
      req.shop = shop;
      return next();
    }

    // If no shopId in param, get shop by sellerId
    if (!shopIdFromParam) {
      const shop = await shopRepository.findBySellerId(userId);
      if (!shop) {
        throw new NotFoundError('Shop not found');
      }
      req.shop = shop;
      return next();
    }

    throw new ForbiddenError('Shop ownership verification failed');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user owns a product (through shop ownership)
 * Uses shopId from token/cache to avoid DB query
 */
export const requireProductOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      throw new ForbiddenError('Authentication required');
    }

    const userId = req.user.userId;
    const shopIdFromToken = req.user.shopId;
    const productId = req.params.productId || req.params.id;

    if (!productId) {
      throw new NotFoundError('Product ID is required');
    }

    // Get product
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // If shopId is in token, use it directly (no DB query for shop)
    if (shopIdFromToken) {
      if (product.shopId !== shopIdFromToken) {
        throw new ForbiddenError('You do not own this product');
      }
      req.product = product;
      req.shopId = shopIdFromToken;
      return next();
    }

    // If no shopId in token, verify shop ownership from DB
    const shop = await shopRepository.findById(product.shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    if (shop.sellerId !== userId) {
      throw new ForbiddenError('You do not own this product');
    }

    req.product = product;
    req.shopId = product.shopId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to ensure user has a shop (for seller routes)
 */
export const requireShop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      throw new ForbiddenError('Authentication required');
    }

    const userId = req.user.userId;
    const shopIdFromToken = req.user.shopId;

    // If shopId is in token, use it directly
    if (shopIdFromToken) {
      const shop = await shopRepository.findById(shopIdFromToken);
      if (!shop) {
        throw new NotFoundError('Shop not found');
      }
      req.shop = shop;
      return next();
    }

    // Get shop from DB
    const shop = await shopRepository.findBySellerId(userId);
    if (!shop) {
      throw new NotFoundError('You do not have a shop. Please create one first.');
    }

    req.shop = shop;
    next();
  } catch (error) {
    next(error);
  }
};

