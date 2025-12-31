import shopRepository from '../repositories/shop.repository';
import productRepository from '../repositories/product.repository';
import { NotFoundError } from '../errors/AppError';
import { ShopStatus } from '../constants';

export interface GetShopProductsQuery {
  status?: string;
  page?: number;
  limit?: number;
}

class ShopService {
  /**
   * Get shop by ID
   */
  async getShopById(id: string) {
    const shop = await shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    // Only return active shops for public
    if (shop.status !== ShopStatus.ACTIVE) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Get shop by slug
   */
  async getShopBySlug(slug: string) {
    const shop = await shopRepository.findBySlug(slug);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    // Only return active shops for public
    if (shop.status !== ShopStatus.ACTIVE) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Get shop products with pagination
   */
  async getShopProducts(shopId: string, query: GetShopProductsQuery = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const status = query.status || ShopStatus.ACTIVE;

    // Verify shop exists and is active
    const shop = await shopRepository.findById(shopId);
    if (!shop || shop.status !== ShopStatus.ACTIVE) {
      throw new NotFoundError('Shop not found');
    }

    // Get products with pagination at database level
    const { products, total } = await productRepository.findByShopId(shopId, status, page, limit);

    return {
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new ShopService();


