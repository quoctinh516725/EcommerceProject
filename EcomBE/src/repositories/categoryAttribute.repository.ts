import prisma from '../config/database';

export interface CreateCategoryAttributeData {
  categoryId: string;
  attributeId: string;
}

class CategoryAttributeRepository {
  /**
   * Find category attribute by ID
   */
  async findById(id: string) {
    return prisma.categoryAttribute.findUnique({
      where: { id },
      include: {
        category: true,
        attribute: true,
      },
    });
  }

  /**
   * Find all attributes of a category
   */
  async findByCategoryId(categoryId: string) {
    return prisma.categoryAttribute.findMany({
      where: { categoryId },
      include: {
        attribute: {
          include: {
            values: true,
          },
        },
      },
    });
  }

  /**
   * Find all categories that have a specific attribute
   */
  async findByAttributeId(attributeId: string) {
    return prisma.categoryAttribute.findMany({
      where: { attributeId },
      include: {
        category: true,
      },
    });
  }

  /**
   * Create new category attribute
   */
  async create(data: CreateCategoryAttributeData) {
    // Check if already exists
    const existing = await prisma.categoryAttribute.findFirst({
      where: {
        categoryId: data.categoryId,
        attributeId: data.attributeId,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.categoryAttribute.create({
      data,
    });
  }

  /**
   * Create multiple category attributes
   */
  async createMany(attributes: CreateCategoryAttributeData[]) {
    return prisma.categoryAttribute.createMany({
      data: attributes,
      skipDuplicates: true as never,
    });
  }

  /**
   * Delete category attribute
   */
  async delete(id: string) {
    return prisma.categoryAttribute.delete({ where: { id } });
  }

  /**
   * Delete all attributes of a category
   */
  async deleteByCategoryId(categoryId: string) {
    return prisma.categoryAttribute.deleteMany({
      where: { categoryId },
    });
  }

  /**
   * Delete all categories of an attribute
   */
  async deleteByAttributeId(attributeId: string) {
    return prisma.categoryAttribute.deleteMany({
      where: { attributeId },
    });
  }
}

export default new CategoryAttributeRepository();

