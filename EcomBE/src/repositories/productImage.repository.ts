import prisma from '../config/database';

export interface CreateProductImageData {
  productId: string;
  imageUrl: string;
  sortOrder?: number;
}

export interface UpdateProductImageData {
  imageUrl?: string;
  sortOrder?: number;
}

class ProductImageRepository {
  /**
   * Find image by ID
   */
  async findById(id: string) {
    return prisma.productImage.findUnique({ where: { id } });
  }

  /**
   * Find all images of a product
   */
  async findByProductId(productId: string) {
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create new product image
   */
  async create(data: CreateProductImageData) {
    return prisma.productImage.create({
      data: {
        productId: data.productId,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  /**
   * Create multiple product images
   */
  async createMany(images: CreateProductImageData[]) {
    return prisma.productImage.createMany({
      data: images.map((img) => ({
        productId: img.productId,
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder ?? 0,
      })),
    });
  }

  /**
   * Update product image
   */
  async update(id: string, data: UpdateProductImageData) {
    return prisma.productImage.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete product image
   */
  async delete(id: string) {
    return prisma.productImage.delete({ where: { id } });
  }

  /**
   * Delete all images of a product
   */
  async deleteByProductId(productId: string) {
    return prisma.productImage.deleteMany({
      where: { productId },
    });
  }
}

export default new ProductImageRepository();

