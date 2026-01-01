import shopRepository from '../../repositories/shop.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../errors/AppError';
import { generateSlug } from '../../utils/slug';
import { ShopStatus } from '../../constants';

export interface CreateShopInput {
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  description?: string;
  logoUrl?: string;
  backgroundUrl?: string;
}

export interface UpdateShopInput {
  name?: string;
  slug?: string;
  address?: string;
  phone?: string;
  description?: string;
  logoUrl?: string;
  backgroundUrl?: string;
}

class SellerShopService {
  /**
   * Get shop of the seller
   */
  async getMyShop(sellerId: string) {
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found. Please create a shop first.');
    }
    return shop;
  }

  /**
   * Create shop for seller
   */
  async createShop(sellerId: string, input: CreateShopInput) {
    // Check if seller already has a shop
    const existingShop = await shopRepository.findBySellerId(sellerId);
    if (existingShop) {
      throw new ConflictError('You already have a shop');
    }

    // Generate slug if not provided
    const slug = input.slug || generateSlug(input.name);

    // Check if slug exists
    const slugExists = await shopRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictError(`Shop with slug "${slug}" already exists`);
    }

    // Create shop with PENDING_APPROVAL status (waiting for staff/admin approval)
    const shop = await shopRepository.create({
      sellerId,
      name: input.name,
      slug,
      address: input.address,
      phone: input.phone,
      description: input.description,
      logoUrl: input.logoUrl,
      backgroundUrl: input.backgroundUrl,
      status: ShopStatus.PENDING_APPROVAL, // Shop must be approved by staff/admin before becoming ACTIVE
    });

    return shop;
  }

  /**
   * Update shop
   */
  async updateShop(sellerId: string, input: UpdateShopInput) {
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Check slug if provided
    if (input.slug && input.slug !== shop.slug) {
      const slugExists = await shopRepository.slugExists(input.slug);
      if (slugExists) {
        throw new ConflictError(`Shop with slug "${input.slug}" already exists`);
      }
    }

    // Update shop
    const updatedShop = await shopRepository.update(shop.id, input);

    return updatedShop;
  }

  /**
   * Update shop status (seller can only set ACTIVE/INACTIVE)
   */
  async updateShopStatus(sellerId: string, status: string) {
    const shop = await shopRepository.findBySellerId(sellerId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Seller can only set ACTIVE or INACTIVE
    if (status !== ShopStatus.ACTIVE && status !== ShopStatus.INACTIVE) {
      throw new ValidationError(`Sellers can only set shop status to ${ShopStatus.ACTIVE} or ${ShopStatus.INACTIVE}`);
    }

    const updatedShop = await shopRepository.update(shop.id, { status });

    return updatedShop;
  }
}

export default new SellerShopService();

