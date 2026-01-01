import productService from '../product.service';
import shopRepository from '../../repositories/shop.repository';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';
import { CreateProductInput, UpdateProductInput } from '../product.service';
import { ProductStatus } from '../../constants';

class SellerProductService {
  /**
   * Get products of seller's shop
   */
  async getMyProducts(sellerId: string, shopId: string, status?: string, page?: number, limit?: number) {
    // Verify shop ownership (shopId should come from middleware)
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    if (shop.sellerId !== sellerId) {
      throw new ForbiddenError('You do not own this shop');
    }

    // Get products with pagination (using repository directly)
    const productRepository = (await import('../../repositories/product.repository')).default;
    return productRepository.findByShopId(shopId, status, page, limit);
  }

  /**
   * Get product by ID (must belong to seller's shop)
   */
  async getMyProduct(sellerId: string, productId: string) {
    // Get shop
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Get product
    const product = await productService.getProductById(productId);

    // Verify ownership
    if (product.shopId !== shop.id) {
      throw new ForbiddenError('You do not own this product');
    }

    return product;
  }

  /**
   * Create product in seller's shop
   */
  async createProduct(sellerId: string, shopId: string, input: CreateProductInput) {
    // Verify shop ownership (shopId should come from middleware)
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    if (shop.sellerId !== sellerId) {
      throw new ForbiddenError('You do not own this shop');
    }

    // Ensure shopId matches
    input.shopId = shopId;

    // Create product
    return productService.createProduct(input);
  }

  /**
   * Update product (must belong to seller's shop)
   */
  async updateProduct(sellerId: string, productId: string, input: UpdateProductInput) {
    // Get shop
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Get product
    const product = await productService.getProductById(productId);

    // Verify ownership
    if (product.shopId !== shop.id) {
      throw new ForbiddenError('You do not own this product');
    }

    // Update product
    return productService.updateProduct(productId, input);
  }

  /**
   * Delete product (must belong to seller's shop)
   */
  async deleteProduct(sellerId: string, productId: string) {
    // Get shop
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Get product
    const product = await productService.getProductById(productId);

    // Verify ownership
    if (product.shopId !== shop.id) {
      throw new ForbiddenError('You do not own this product');
    }

    // Delete product
    return productService.deleteProduct(productId);
  }

  /**
   * Update product status (seller can only set PENDING_APPROVAL/ACTIVE/INACTIVE)
   */
  async updateProductStatus(sellerId: string, productId: string, status: string) {
    // Get shop
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Get product
    const product = await productService.getProductById(productId);

    // Verify ownership
    if (product.shopId !== shop.id) {
      throw new ForbiddenError('You do not own this product');
    }

    // Seller can only set certain statuses
    const allowedStatuses = [ProductStatus.PENDING_APPROVAL, ProductStatus.ACTIVE, ProductStatus.INACTIVE, ProductStatus.REJECTED, ProductStatus.OUT_OF_STOCK, ProductStatus.DISCONTINUED];
    if (!allowedStatuses.includes(status as any)) {
      throw new ForbiddenError(`Sellers can only set product status to: ${allowedStatuses.join(', ')}`);
    }

    // Update status
    return productService.updateProduct(productId, { status });
  }
}

export default new SellerProductService();

