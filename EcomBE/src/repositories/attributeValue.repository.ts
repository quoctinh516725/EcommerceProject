import prisma from '../config/database';

export interface CreateAttributeValueData {
  attributeId: string;
  value: string;
}

export interface UpdateAttributeValueData {
  value?: string;
}

class AttributeValueRepository {
  /**
   * Find attribute value by ID
   */
  async findById(id: string) {
    return prisma.attributeValue.findUnique({
      where: { id },
      include: {
        attribute: true,
      },
    });
  }

  /**
   * Find all values of an attribute
   */
  async findByAttributeId(attributeId: string) {
    return prisma.attributeValue.findMany({
      where: { attributeId },
      orderBy: { value: 'asc' },
    });
  }

  /**
   * Create new attribute value
   */
  async create(data: CreateAttributeValueData) {
    return prisma.attributeValue.create({
      data,
    });
  }

  /**
   * Create multiple attribute values
   */
  async createMany(values: CreateAttributeValueData[]) {
    return prisma.attributeValue.createMany({
      data: values,
      skipDuplicates: true as never,
    });
  }

  /**
   * Update attribute value
   */
  async update(id: string, data: UpdateAttributeValueData) {
    return prisma.attributeValue.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete attribute value
   */
  async delete(id: string) {
    return prisma.attributeValue.delete({ where: { id } });
  }

  /**
   * Delete all values of an attribute
   */
  async deleteByAttributeId(attributeId: string) {
    return prisma.attributeValue.deleteMany({
      where: { attributeId },
    });
  }
}

export default new AttributeValueRepository();

