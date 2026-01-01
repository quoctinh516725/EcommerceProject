import productRepository from '../repositories/product.repository';
import productImageRepository from '../repositories/productImage.repository';
import productVariantRepository from '../repositories/productVariant.repository';
import productTagRepository from '../repositories/productTag.repository';

import shopRepository from '../repositories/shop.repository';
import categoryRepository from '../repositories/category.repository';
import brandRepository from '../repositories/brand.repository';
import { meiliClient } from '../libs/meilisearch';
import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import { ProductStatus } from '../constants';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { generateSlug } from '../utils/slug';
const MEILI_INDEX_NAME = 'products';

export interface CreateProductInput {
  shopId: string;
  categoryId: string;
  brandId?: string | null;
  name: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  originalPrice?: string;
  status?: string;
  images?: Array<{ imageUrl: string; sortOrder?: number }>;
  variants?: Array<{
    sku?: string; // Optional - will be generated from variantName if not provided
    variantName?: string;
    imageUrl?: string;
    price: string;
    stock: number;
    weight?: number;
    status?: string;
    attributes?: Array<{ attributeId: string; attributeValueId?: string | null }>;
  }>;
  tags?: string[];
}

export interface UpdateProductInput {
  categoryId?: string;
  brandId?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  originalPrice?: string;
  status?: string;
}

export interface SearchProductsQuery {
  q?: string;
  categoryId?: string;
  brandId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'created_at_desc' | 'rating_desc';
}

export interface ProductSearchResult {
  hits: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generate slug from name
 */


/**
 * Generate SKU from variant name and product slug
 */
const generateSku = (productSlug: string, variantName?: string, index?: number): string => {
  if (variantName) {
    const variantSlug = generateSlug(variantName);
    return `${productSlug}-${variantSlug}`;
  }
  // If no variant name, use index
  return `${productSlug}-variant-${index || 0}`;
};

class ProductService {
  /**
   * Ensure MeiliSearch index exists and is configured
   */
  private async ensureMeiliIndex() {
    try {
      const index = meiliClient.index(MEILI_INDEX_NAME);
      
      // Try to get index settings to check if it exists
      try {
        await index.getSettings();
      } catch (error: any) {
        // Index doesn't exist, create it
        if (error.code === 'index_not_found') {
          await meiliClient.createIndex(MEILI_INDEX_NAME, {
            primaryKey: 'id',
          });
        } else {
          throw error;
        }
      }

      // Configure searchable attributes
      await index.updateSearchableAttributes([
        'name',
        'description',
        'categoryName',
        'brandName',
        'shopName',
        'tags',
      ]);

      // Configure filterable attributes
      await index.updateFilterableAttributes([
        'categoryId',
        'brandId',
        'shopId',
        'status',
        'minPrice',
        'maxPrice',
        'rating',
      ]);

      // Configure sortable attributes
      await index.updateSortableAttributes([
        'minPrice',
        'maxPrice',
        'rating',
        'soldCount',
        'createdAt',
      ]);

      // Configure ranking rules
      await index.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ]);
    } catch (error) {
      console.error('Error ensuring MeiliSearch index:', error);
      // Don't throw - allow service to work without MeiliSearch
    }
  }

  /**
   * Build MeiliSearch document from product
   */
  private async buildMeiliDocument(product: any) {
    // Get all variants to calculate min/max price
    const variants = await productVariantRepository.findByProductId(product.id);
    const prices = variants
      .filter((v) => v.status === ProductStatus.ACTIVE)
      .map((v) => parseFloat(v.price.toString()));
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Get tags
    const tags = await productTagRepository.findByProductId(product.id);
    const tagNames = tags.map((t) => t.tag);

    // Get images
    const images = await productImageRepository.findByProductId(product.id);
    const imageUrls = images.map((img) => img.imageUrl);

    // Get category and brand info
    const category = await categoryRepository.findById(product.categoryId);
    const brand = product.brandId ? await brandRepository.findById(product.brandId) : null;
    const shop = await shopRepository.findById(product.shopId);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      thumbnailUrl: product.thumbnailUrl || '',
      imageUrls,
      categoryId: product.categoryId,
      categoryName: category?.name || '',
      brandId: product.brandId || '',
      brandName: brand?.name || '',
      shopId: product.shopId,
      shopName: shop?.name || '',
      minPrice,
      maxPrice,
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
      status: product.status,
      rating: product.rating || 0,
      soldCount: product.soldCount || 0,
      tags: tagNames,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  /**
   * Sync product to MeiliSearch
   */
  private async syncProductToMeiliSearch(productId: string) {
    try {
      await this.ensureMeiliIndex();
      
      const product = await productRepository.findById(productId);
      if (!product) {
        return;
      }

      // Only sync active products (exclude BANNED, REJECTED, INACTIVE, etc.)
      if (product.status !== ProductStatus.ACTIVE) {
        // Delete from MeiliSearch if not active (including BANNED products)
        const index = meiliClient.index(MEILI_INDEX_NAME);
        await index.deleteDocument(productId);
        return;
      }

      const document = await this.buildMeiliDocument(product);
      const index = meiliClient.index(MEILI_INDEX_NAME);
      await index.addDocuments([document]);
    } catch (error) {
      console.error(`Error syncing product ${productId} to MeiliSearch:`, error);
      // Don't throw - allow service to work without MeiliSearch
    }
  }

  /**
   * Delete product from MeiliSearch
   */
  private async deleteProductFromMeiliSearch(productId: string) {
    try {
      const index = meiliClient.index(MEILI_INDEX_NAME);
      await index.deleteDocument(productId);
    } catch (error) {
      console.error(`Error deleting product ${productId} from MeiliSearch:`, error);
      // Don't throw - allow service to work without MeiliSearch
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  /**
   * Get all products (for public - only ACTIVE by default)
   */
  async getAllProducts(status?: string, page?: number, limit?: number) {
    // Public can only view ACTIVE products
    const productStatus = status || ProductStatus.ACTIVE;
    
    // If status is provided and not ACTIVE, only allow ACTIVE for public
    if (status && status !== ProductStatus.ACTIVE) {
      throw new ValidationError('Public can only view ACTIVE products');
    }

    const { products, total } = await productRepository.findAll(productStatus, page, limit);

    return {
      products,
      total,
    };
  }

  /**
   * Get products by shop ID with pagination
   */
  async getProductsByShopId(shopId: string, status?: string, page?: number, limit?: number) {
    return productRepository.findByShopId(shopId, status, page, limit);
  }

  /**
   * Get products by category ID with pagination
   */
  async getProductsByCategoryId(categoryId: string, status?: string, page?: number, limit?: number) {
    return productRepository.findByCategoryId(categoryId, status, page, limit);
  }

  /**
   * Create new product
   */
  async createProduct(input: CreateProductInput) {
    // Validate shop
    const shop = await shopRepository.findById(input.shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Validate category
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Validate brand if provided
    if (input.brandId) {
      const brand = await brandRepository.findById(input.brandId);
      if (!brand) {
        throw new NotFoundError('Brand not found');
      }
    }

    // Generate slug if not provided
    const slug = input.slug || generateSlug(input.name);

    // Check if slug exists
    const slugExists = await productRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictError(`Product with slug "${slug}" already exists`);
    }

    // Validate variants
    if (input.variants && input.variants.length === 0) {
      throw new ValidationError('Product must have at least one variant');
    }

    // Create product with transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          shopId: input.shopId,
          categoryId: input.categoryId,
          brandId: input.brandId ?? null,
          name: input.name,
          slug,
          description: input.description,
          thumbnailUrl: input.thumbnailUrl,
          originalPrice: input.originalPrice
            ? new Prisma.Decimal(input.originalPrice)
            : null,
          status: input.status || ProductStatus.PENDING_APPROVAL,
        },
      });

      // Create images
      if (input.images && input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((img, index) => ({
            productId: newProduct.id,
            imageUrl: img.imageUrl,
            sortOrder: img.sortOrder ?? index,
          })),
        });
      }

      // Create variants
      if (input.variants && input.variants.length > 0) {
        // Get category attributes for validation
        const categoryAttributes = await tx.categoryAttribute.findMany({
          where: { categoryId: input.categoryId },
          include: { attribute: true },
        });
        const allowedAttributeIds = new Set(categoryAttributes.map((ca) => ca.attributeId));

        for (let index = 0; index < input.variants.length; index++) {
          const variantInput = input.variants[index];
          
          // Generate SKU if not provided
          let sku = variantInput.sku;
          if (!sku) {
            sku = generateSku(slug, variantInput.variantName, index);
            // Ensure uniqueness by appending index if needed
            const timestamp = Date.now().toString().slice(-6);
            sku = `${sku}-${timestamp}`;
          } else {
            // Check SKU uniqueness if provided
            const existingVariant = await tx.productVariant.findUnique({
              where: { sku },
            });
            if (existingVariant) {
              throw new ConflictError(`Variant with SKU "${sku}" already exists`);
            }
          }

          // Validate attributes if provided
          if (variantInput.attributes && variantInput.attributes.length > 0) {
            for (const attr of variantInput.attributes) {
              // Check if attribute is allowed for this category
              if (!allowedAttributeIds.has(attr.attributeId)) {
                throw new ValidationError(
                  `Attribute ${attr.attributeId} is not allowed for this category`
                );
              }

              // Validate attribute value if provided
              if (attr.attributeValueId) {
                const attrValue = await tx.attributeValue.findUnique({
                  where: { id: attr.attributeValueId },
                });
                if (!attrValue || attrValue.attributeId !== attr.attributeId) {
                  throw new ValidationError(
                    `Attribute value ${attr.attributeValueId} does not belong to attribute ${attr.attributeId}`
                  );
                }
              }
            }
          }

          const variant = await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              sku,
              variantName: variantInput.variantName,
              imageUrl: variantInput.imageUrl,
              price: new Prisma.Decimal(variantInput.price),
              stock: variantInput.stock,
              weight: variantInput.weight,
              status: variantInput.status ,
            },
          });

          // Create variant attributes
          if (variantInput.attributes && variantInput.attributes.length > 0) {
            await tx.productAttribute.createMany({
              data: variantInput.attributes.map((attr) => ({
                productVariantId: variant.id,
                attributeId: attr.attributeId,
                attributeValueId: attr.attributeValueId ?? null,
              })),
            });
          }
        }
      }

      // Create tags
      if (input.tags && input.tags.length > 0) {
        await tx.productTag.createMany({
          data: input.tags.map((tag) => ({
            productId: newProduct.id,
            tag,
          })),
          skipDuplicates: true as never,
        });
      }

      // Increment shop total products
      await tx.shop.update({
        where: { id: input.shopId },
        data: {
          totalProducts: {
            increment: 1,
          },
        },
      });

      return newProduct;
    });

    // Sync to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(product.id).catch(console.error);

    // Return product with relations
    return this.getProductById(product.id);
  }

  /**
   * Update product
   */
  async updateProduct(id: string, input: UpdateProductInput) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Validate category if changed
    if (input.categoryId && input.categoryId !== product.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // Validate brand if changed
    if (input.brandId !== undefined && input.brandId !== product.brandId) {
      if (input.brandId) {
        const brand = await brandRepository.findById(input.brandId);
        if (!brand) {
          throw new NotFoundError('Brand not found');
        }
      }
    }

    // Check slug if provided
    if (input.slug && input.slug !== product.slug) {
      const slugExists = await productRepository.slugExists(input.slug);
      if (slugExists) {
        throw new ConflictError(`Product with slug "${input.slug}" already exists`);
      }
    }

    const updatedProduct = await productRepository.update(id, input);

    // Sync to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(id).catch(console.error);

    return this.getProductById(id);
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Delete product (cascade will handle related records)
    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      
      // Decrement shop total products
      await tx.shop.update({
        where: { id: product.shopId },
        data: {
          totalProducts: {
            decrement: 1,
          },
        },
      });
    });

    // Delete from MeiliSearch (async, don't wait)
    this.deleteProductFromMeiliSearch(id).catch(console.error);
  }

  /**
   * Search products using MeiliSearch
   */
  async searchProducts(query: SearchProductsQuery): Promise<ProductSearchResult> {
    try {
      await this.ensureMeiliIndex();
      
      const index = meiliClient.index(MEILI_INDEX_NAME);
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      // Build filters
      const filters: string[] = [];
      if (query.categoryId) {
        filters.push(`categoryId = "${query.categoryId}"`);
      }
      if (query.brandId) {
        filters.push(`brandId = "${query.brandId}"`);
      }
      if (query.shopId) {
        filters.push(`shopId = "${query.shopId}"`);
      }
      if (query.status) {
        filters.push(`status = "${query.status}"`);
      } else {
        // Default to active products only (exclude BANNED and REJECTED)
        filters.push(`status = "${ProductStatus.ACTIVE}"`);
      }
      
      // Always exclude BANNED products from public search
      filters.push(`status != "${ProductStatus.BANNED}"`);
      if (query.minPrice !== undefined) {
        filters.push(`minPrice >= ${query.minPrice}`);
      }
      if (query.maxPrice !== undefined) {
        filters.push(`maxPrice <= ${query.maxPrice}`);
      }

      // Build sort
      let sort: string[] = [];
      switch (query.sortBy) {
        case 'price_asc':
          sort = ['minPrice:asc'];
          break;
        case 'price_desc':
          sort = ['minPrice:desc'];
          break;
        case 'rating_desc':
          sort = ['rating:desc'];
          break;
        case 'created_at_desc':
          sort = ['createdAt:desc'];
          break;
        case 'relevance':
        default:
          // MeiliSearch default relevance
          break;
      }

      const searchResult = await index.search(query.q || '', {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        sort,
        limit,
        offset,
      });

      return {
        hits: searchResult.hits,
        total: searchResult.estimatedTotalHits || 0,
        page,
        limit,
        totalPages: Math.ceil((searchResult.estimatedTotalHits || 0) / limit),
      };
    } catch (error) {
      console.error('Error searching products with MeiliSearch:', error);
      // Fallback to database search if MeiliSearch fails
      return this.searchProductsFallback(query);
    }
  }

  /**
   * Fallback database search when MeiliSearch is unavailable
   */
  private async searchProductsFallback(query: SearchProductsQuery): Promise<ProductSearchResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.brandId) {
      where.brandId = query.brandId;
    }
    if (query.shopId) {
      where.shopId = query.shopId;
    }
    if (query.status) {
      where.status = query.status;
    } else {
      where.status = ProductStatus.ACTIVE;
    }

    // Simple text search on name and description
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          variants: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: query.sortBy === 'created_at_desc' 
          ? { createdAt: 'desc' }
          : { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      hits: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Reindex all active products to MeiliSearch
   */
  async reindexAllProducts() {
    try {
      await this.ensureMeiliIndex();
      
      const products = await productRepository.findAllActive();
      const index = meiliClient.index(MEILI_INDEX_NAME);

      const documents = await Promise.all(
        products.map((product) => this.buildMeiliDocument(product))
      );

      await index.addDocuments(documents);
      return { success: true, count: documents.length };
    } catch (error) {
      console.error('Error reindexing products:', error);
      throw error;
    }
  }

  /**
   * Update product variant (with auto-sync to MeiliSearch)
   */
  async updateVariant(variantId: string, data: {
    sku?: string;
    variantName?: string;
    imageUrl?: string;
    price?: string;
    stock?: number;
    weight?: number;
    status?: string;
  }) {
    const variant = await productVariantRepository.findById(variantId);
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== variant.sku) {
      const existingVariant = await prisma.productVariant.findUnique({
        where: { sku: data.sku },
        select: { id: true },
      });
      if (existingVariant && existingVariant.id !== variantId) {
        throw new ConflictError(`Variant with SKU "${data.sku}" already exists`);
      }
    }

    await productVariantRepository.update(variantId, {
      sku: data.sku,
      variantName: data.variantName,
      imageUrl: data.imageUrl,
      price: data.price,
      stock: data.stock,
      weight: data.weight,
      status: data.status,
    });

    // Sync product to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(variant.productId).catch(console.error);

    return productVariantRepository.findById(variantId);
  }

  /**
   * Delete product variant (with auto-sync to MeiliSearch)
   */
  async deleteVariant(variantId: string) {
    const variant = await productVariantRepository.findById(variantId);
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }

    const productId = variant.productId;
    await productVariantRepository.delete(variantId);

    // Sync product to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(productId).catch(console.error);
  }

  /**
   * Update product image (with auto-sync to MeiliSearch)
   */
  async updateImage(imageId: string, data: { imageUrl?: string; sortOrder?: number }) {
    const image = await productImageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError('Image not found');
    }

    await productImageRepository.update(imageId, data);

    // Sync product to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(image.productId).catch(console.error);

    return productImageRepository.findById(imageId);
  }

  /**
   * Delete product image (with auto-sync to MeiliSearch)
   */
  async deleteImage(imageId: string) {
    const image = await productImageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError('Image not found');
    }

    const productId = image.productId;
    await productImageRepository.delete(imageId);

    // Sync product to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(productId).catch(console.error);
  }

  /**
   * Add product tag (with auto-sync to MeiliSearch)
   */
  async addTag(productId: string, tag: string) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await productTagRepository.create({ productId, tag });

    // Sync product to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(productId).catch(console.error);
  }

  /**
   * Delete product tag (with auto-sync to MeiliSearch)
   */
  async deleteTag(tagId: string) {
    const tag = await productTagRepository.findById(tagId);
    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    const productId = tag.productId;
    await productTagRepository.delete(tagId);

    // Sync product to MeiliSearch (async, don't wait)
    this.syncProductToMeiliSearch(productId).catch(console.error);
  }

  /**
   * Sync all products related to a category (when category name changes)
   */
  async syncProductsByCategoryId(categoryId: string) {
    const productIds = await productRepository.findIdsByCategoryId(categoryId);
    for (const { id } of productIds) {
      this.syncProductToMeiliSearch(id).catch(console.error);
    }
  }

  /**
   * Sync all products related to a brand (when brand name changes)
   */
  async syncProductsByBrandId(brandId: string) {
    const productIds = await productRepository.findIdsByBrandId(brandId);
    for (const { id } of productIds) {
      this.syncProductToMeiliSearch(id).catch(console.error);
    }
  }

  /**
   * Sync all products related to a shop (when shop name changes)
   */
  async syncProductsByShopId(shopId: string) {
    const productIds = await productRepository.findIdsByShopId(shopId);
    for (const { id } of productIds) {
      this.syncProductToMeiliSearch(id).catch(console.error);
    }
  }
}

export default new ProductService();

