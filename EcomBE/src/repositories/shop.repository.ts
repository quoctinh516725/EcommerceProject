import prisma from "../config/database";

export interface CreateShopData {
  sellerId: string;
  name: string;
  address?: string;
  phone?: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  status?: string;
}

export interface UpdateShopData {
  name?: string;
  address?: string;
  phone?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  status?: string;
  rating?: number;
  totalProducts?: number;
  totalOrders?: number;
}

class ShopRepository {
  /**
   * Find shop by ID
   */
  async findById(id: string) {
    return prisma.shop.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Find shop by slug
   */
  async findBySlug(slug: string) {
    return prisma.shop.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Find shop by seller ID
   */
  async findBySellerId(sellerId: string) {
    return prisma.shop.findFirst({
      where: { sellerId },
    });
  }

  /**
   * Find all shops
   */
  async findAll(status?: string, page: number = 1, limit: number = 20) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    return {
      shops,
      total,
    };
  }

  /**
   * Find shops by status
   */
  async findByStatus(status: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where: { status },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where: { status } }),
    ]);

    return {
      shops,
      total,
    };
  }

  /**
   * Find active shops only
   */
  async findActiveShops() {
    const { ShopStatus } = await import("../constants");
    return prisma.shop.findMany({
      where: { status: ShopStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new shop
   */
  async create(data: CreateShopData) {
    return prisma.shop.create({
      data: {
        sellerId: data.sellerId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        slug: data.slug,
        description: data.description,
        logoUrl: data.logoUrl,
        backgroundUrl: data.backgroundUrl,
        status: data.status || (await import("../constants")).ShopStatus.ACTIVE,
      },
    });
  }

  /**
   * Update shop
   */
  async update(id: string, data: UpdateShopData) {
    return prisma.shop.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete shop
   */
  async delete(id: string) {
    return prisma.shop.delete({ where: { id } });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string): Promise<boolean> {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: { id: true },
    });
    return shop !== null;
  }

  /**
   * Increment total products count
   */
  async incrementTotalProducts(shopId: string) {
    return prisma.shop.update({
      where: { id: shopId },
      data: {
        totalProducts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Decrement total products count
   */
  async decrementTotalProducts(shopId: string) {
    return prisma.shop.update({
      where: { id: shopId },
      data: {
        totalProducts: {
          decrement: 1,
        },
      },
    });
  }
}

export default new ShopRepository();
