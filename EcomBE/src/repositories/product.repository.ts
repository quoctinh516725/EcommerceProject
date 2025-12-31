import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export interface CreateProductData {
  shopId: string;
  categoryId: string;
  brandId?: string | null;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  originalPrice?: string; // Decimal as string
  status?: string;
}

export interface UpdateProductData {
  categoryId?: string;
  brandId?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  originalPrice?: string; // Decimal as string
  status?: string;
}

class ProductRepository {
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        tags: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        variants: true,
        tags: true,
      },
    });
  }

  async create(data: CreateProductData) {
    return prisma.product.create({
      data: {
        shopId: data.shopId,
        categoryId: data.categoryId,
        brandId: data.brandId ?? null,
        name: data.name,
        slug: data.slug,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        originalPrice: data.originalPrice
          ? new Prisma.Decimal(data.originalPrice)
          : undefined,
        status: data.status ?? 'PENDING_APPROVAL',
      },
    });
  }

  async update(id: string, data: UpdateProductData) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        brandId: data.brandId === undefined ? undefined : data.brandId,
        originalPrice: data.originalPrice
          ? new Prisma.Decimal(data.originalPrice)
          : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  /**
   * Find products by shop ID with pagination
   */
  async findByShopId(shopId: string, status?: string, page?: number, limit?: number) {
    const where: any = { shopId };
    if (status) {
      where.status = status;
    }
    
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          variants: true,
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  /**
   * Find products by category ID with pagination
   */
  async findByCategoryId(categoryId: string, status?: string, page?: number, limit?: number) {
    const where: any = { categoryId };
    if (status) {
      where.status = status;
    }
    
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  /**
   * Find products by brand ID with pagination
   */
  async findByBrandId(brandId: string, status?: string, page?: number, limit?: number) {
    const where: any = { brandId };
    if (status) {
      where.status = status;
    }
    
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  /**
   * Find all products with pagination
   */
  async findAll(status?: string, page?: number, limit?: number) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          variants: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  /**
   * Find all product IDs by category/brand/shop (for sync purposes)
   */
  async findIdsByCategoryId(categoryId: string) {
    return prisma.product.findMany({
      where: { categoryId },
      select: { id: true },
    });
  }

  async findIdsByBrandId(brandId: string) {
    return prisma.product.findMany({
      where: { brandId },
      select: { id: true },
    });
  }

  async findIdsByShopId(shopId: string) {
    return prisma.product.findMany({
      where: { shopId },
      select: { id: true },
    });
  }

  /**
   * Find products by status
   */
  async findByStatus(status: string) {
    return prisma.product.findMany({
      where: { status },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all active products
   */
  async findAllActive() {
    return prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        images: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count products by shop ID
   */
  async countByShopId(shopId: string, status?: string) {
    const where: any = { shopId };
    if (status) {
      where.status = status;
    }
    return prisma.product.count({ where });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    return product !== null;
  }
}

export default new ProductRepository();
