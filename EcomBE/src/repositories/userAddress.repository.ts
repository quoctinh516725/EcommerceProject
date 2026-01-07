import prisma from "../config/database";

export interface CreateUserAddressData {
  userId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  isDefault?: boolean;
}

export interface UpdateUserAddressData {
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  isDefault?: boolean;
}

class UserAddressRepository {
  /**
   * Find address by ID
   */
  async findById(id: string) {
    return prisma.userAddress.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * Find all addresses of a user
   */
  async findByUserId(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" }, // Default address first
        { createdAt: "desc" },
      ],
    });
  }

  /**
   * Find default address of a user
   */
  async findDefaultByUserId(userId: string) {
    return prisma.userAddress.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  /**
   * Create new address
   */
  async create(data: CreateUserAddressData) {
    // If this is set as default, unset other default addresses
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: {
          userId: data.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return prisma.userAddress.create({
      data,
    });
  }

  /**
   * Update address
   */
  async update(id: string, data: UpdateUserAddressData) {
    // If setting this as default, unset other default addresses
    if (data.isDefault === true) {
      const address = await prisma.userAddress.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (address) {
        await prisma.userAddress.updateMany({
          where: {
            userId: address.userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }

    return prisma.userAddress.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete address
   */
  async delete(id: string) {
    return prisma.userAddress.delete({
      where: { id },
    });
  }

  /**
   * Check if address belongs to user
   */
  async belongsToUser(id: string, userId: string): Promise<boolean> {
    const address = await prisma.userAddress.findUnique({
      where: { id },
      select: { userId: true },
    });

    return address?.userId === userId;
  }
}

export default new UserAddressRepository();
