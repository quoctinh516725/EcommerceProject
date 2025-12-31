import brandRepository from '../repositories/brand.repository';
import { ConflictError, NotFoundError } from '../errors/AppError';
import { generateSlug } from '../utils/slug';

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}

/**
 * Generate slug from name
 */

class BrandService {
  /**
   * Get all brands
   */
  async getAllBrands() {
    return brandRepository.findAll();
  }

  /**
   * Get brand by ID
   */
  async getBrandById(id: string) {
    const brand = await brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }
    return brand;
  }

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string) {
    const brand = await brandRepository.findBySlug(slug);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }
    return brand;
  }

  /**
   * Create new brand
   */
  async createBrand(input: CreateBrandInput) {
    // Generate slug if not provided
    const slug = input.slug || generateSlug(input.name);

    // Check if slug exists
    const existingBrand = await brandRepository.findBySlug(slug);
    if (existingBrand) {
      throw new ConflictError(`Brand with slug "${slug}" already exists`);
    }

    const newBrand = await brandRepository.create({
      name: input.name,
      slug,
      description: input.description,
      logoUrl: input.logoUrl,
    });

    // Clear brand cache
    const { deleteCachePattern } = await import('../utils/cache');
    deleteCachePattern('brand:*').catch(console.error);

    return newBrand;
  }

  /**
   * Update brand
   */
  async updateBrand(id: string, input: UpdateBrandInput) {
    const brand = await brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    // Check slug if provided
    if (input.slug && input.slug !== brand.slug) {
      const existingBrand = await brandRepository.findBySlug(input.slug);
      if (existingBrand) {
        throw new ConflictError(`Brand with slug "${input.slug}" already exists`);
      }
    }

    const updatedBrand = await brandRepository.update(id, input);

    // If name changed, sync all related products to MeiliSearch
    if (input.name && input.name !== brand.name) {
      // Import here to avoid circular dependency
      const productService = (await import('./product.service')).default;
      productService.syncProductsByBrandId(id).catch(console.error);
    }

    // Clear brand cache
    const { deleteCachePattern } = await import('../utils/cache');
    deleteCachePattern('brand:*').catch(console.error);

    return updatedBrand;
  }

  /**
   * Delete brand
   */
  async deleteBrand(id: string) {
    const brand = await brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    return brandRepository.delete(id);
  }
}

export default new BrandService();

