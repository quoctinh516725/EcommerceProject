import prisma from "../config/database";
export interface ProductReviewData {
  productId: string;
  orderItemId: string;
  rating: number;
  comment?: string;
  images?: string;
  userId: string;
}

export interface ShopReviewData {
  shopId: string;
  rating: number;
  comment?: string;
  images?: string;
  userId: string;
  subOrderId: string;
}

export class ReviewRepository {
  async createProductReview(data: ProductReviewData) {
    return prisma.productReview.create({
      data,
    });
  }

  async createShopReview(data: ShopReviewData) {
    return prisma.shopReview.create({
      data,
    });
  }

  async findProductReviews(
    productId: string,
    params: {
      page: number;
      limit: number;
      rating?: number;
      hasImages?: boolean;
    }
  ) {
    const { page, limit, rating, hasImages } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      productId,
      isHidden: false,
    };

    if (rating) {
      where.rating = rating;
    }

    if (hasImages) {
      where.images = { not: null };
    }

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          orderItem: {
            select: {
              variantName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.productReview.count({ where }),
    ]);

    return { reviews, total };
  }

  async findShopReviews(
    shopId: string,
    params: { page: number; limit: number; rating?: number }
  ) {
    const { page, limit, rating } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      shopId,
      isHidden: false,
    };

    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.shopReview.count({ where }),
    ]);

    return { reviews, total };
  }

  async getAverageProductRating(productId: string) {
    const aggregate = await prisma.productReview.aggregate({
      where: { productId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      average: aggregate._avg.rating || 0,
      count: aggregate._count.rating || 0,
    };
  }

  async replyProductReview(reviewId: string, reply: string) {
    return prisma.productReview.update({
      where: { id: reviewId },
      data: {
        reply,
        replyAt: new Date(),
      },
    });
  }

  async replyShopReview(reviewId: string, reply: string) {
    return prisma.shopReview.update({
      where: { id: reviewId },
      data: {
        reply,
        replyAt: new Date(),
      },
    });
  }

  async createReport(data: any) {
    return prisma.reviewReport.create({
      data,
    });
  }

  async findProductReviewById(id: string) {
    return prisma.productReview.findUnique({
      where: { id },
    });
  }

  async findShopReviewById(id: string) {
    return prisma.shopReview.findUnique({
      where: { id },
    });
  }

  async updateProductReview(id: string, data: any) {
    return prisma.productReview.update({
      where: { id },
      data,
    });
  }

  async updateShopReview(id: string, data: any) {
    return prisma.shopReview.update({
      where: { id },
      data,
    });
  }

  async deleteProductReview(id: string) {
    return prisma.productReview.delete({
      where: { id },
    });
  }

  async deleteShopReview(id: string) {
    return prisma.shopReview.delete({
      where: { id },
    });
  }
}
