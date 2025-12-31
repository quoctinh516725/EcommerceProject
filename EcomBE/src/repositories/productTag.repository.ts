import prisma from '../config/database';

export interface CreateProductTagData {
  productId: string;
  tag: string;
}

class ProductTagRepository {
  /**
   * Find tag by ID
   */
  async findById(id: string) {
    return prisma.productTag.findUnique({ where: { id } });
  }

  /**
   * Find all tags of a product
   */
  async findByProductId(productId: string) {
    return prisma.productTag.findMany({
      where: { productId },
      orderBy: { tag: 'asc' },
    });
  }

  /**
   * Create new product tag
   */
  async create(data: CreateProductTagData) {
    return prisma.productTag.create({
      data,
    });
  }

  /**
   * Create multiple product tags
   */
  async createMany(tags: CreateProductTagData[]) {
    return prisma.productTag.createMany({
      data: tags,
      skipDuplicates: true,
    });
  }

  /**
   * Delete product tag
   */
  async delete(id: string) {
    return prisma.productTag.delete({ where: { id } });
  }

  /**
   * Delete all tags of a product
   */
  async deleteByProductId(productId: string) {
    return prisma.productTag.deleteMany({
      where: { productId },
    });
  }
}

export default new ProductTagRepository();

