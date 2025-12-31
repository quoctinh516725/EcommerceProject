import prisma from '../config/database';

export interface CreateProductAttributeData {
  productVariantId: string;
  attributeId: string;
  attributeValueId?: string | null;
}

export interface UpdateProductAttributeData {
  attributeId?: string;
  attributeValueId?: string | null;
}

class ProductAttributeRepository {
  /**
   * Find product attribute by ID
   */
  async findById(id: string) {
    return prisma.productAttribute.findUnique({
      where: { id },
      include: {
        attribute: true,
        attributeValue: true,
      },
    });
  }

  /**
   * Find all attributes of a product variant
   */
  async findByProductVariantId(productVariantId: string) {
    return prisma.productAttribute.findMany({
      where: { productVariantId },
      include: {
        attribute: true,
        attributeValue: true,
      },
    });
  }

  /**
   * Find all attributes of a product (through all variants)
   */
  async findByProductId(productId: string) {
    return prisma.productAttribute.findMany({
      where: {
        productVariant: {
          productId,
        },
      },
      include: {
        attribute: true,
        attributeValue: true,
        productVariant: {
          select: {
            id: true,
            variantName: true,
          },
        },
      },
    });
  }

  /**
   * Create new product attribute
   */
  async create(data: CreateProductAttributeData) {
    return prisma.productAttribute.create({
      data: {
        productVariantId: data.productVariantId,
        attributeId: data.attributeId,
        attributeValueId: data.attributeValueId ?? null,
      },
    });
  }

  /**
   * Create multiple product attributes
   */
  async createMany(attributes: CreateProductAttributeData[]) {
    return prisma.productAttribute.createMany({
      data: attributes.map((attr) => ({
        productVariantId: attr.productVariantId,
        attributeId: attr.attributeId,
        attributeValueId: attr.attributeValueId ?? null,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Update product attribute
   */
  async update(id: string, data: UpdateProductAttributeData) {
    return prisma.productAttribute.update({
      where: { id },
      data: {
        ...data,
        attributeValueId: data.attributeValueId === undefined ? undefined : data.attributeValueId,
      },
    });
  }

  /**
   * Delete product attribute
   */
  async delete(id: string) {
    return prisma.productAttribute.delete({ where: { id } });
  }

  /**
   * Delete all attributes of a product variant
   */
  async deleteByProductVariantId(productVariantId: string) {
    return prisma.productAttribute.deleteMany({
      where: { productVariantId },
    });
  }
}

export default new ProductAttributeRepository();

