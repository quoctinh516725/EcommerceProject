import { ReviewRepository } from "../repositories/review.repository";
import prisma from "../config/database";
import { AppError } from "../errors/AppError";
import { SubOrderStatus } from "../constants/order-status";
import { ProductReviewData } from "../repositories/review.repository";

const reviewRepository = new ReviewRepository();

export class ReviewService {
  async createProductReview(userId: string, data: ProductReviewData) {
    // 1. Verify that the OrderItem belongs to the user and is DELIVERED/COMPLETED
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: data.orderItemId,
        productId: data.productId,
        subOrder: {
          masterOrder: { userId },
          status: { in: [SubOrderStatus.DELIVERED, SubOrderStatus.COMPLETED] },
        },
      },
      include: {
        review: true,
      } as any,
    });

    if (!orderItem) {
      throw new AppError(
        "You have not purchased this product or the order is not completed",
        400
      );
    }

    if ((orderItem as any).review) {
      throw new AppError("You have already reviewed this product", 400);
    }

    // 2. Create Review
    const review = await reviewRepository.createProductReview({
      rating: data.rating,
      comment: data.comment,
      images: data.images ? JSON.stringify(data.images) : undefined,
      userId,
      productId: data.productId,
      orderItemId: data.orderItemId,
    });

    // 3. Update Product Rating
    this.updateProductRatingAggregates(data.productId);

    return review;
  }

  async createShopReview(
    userId: string,
    data: {
      shopId: string;
      subOrderId: string;
      rating: number;
      comment?: string;
    }
  ) {
    // 1. Verify SubOrder
    const subOrder = await prisma.subOrder.findFirst({
      where: {
        id: data.subOrderId,
        shopId: data.shopId,
        masterOrder: { userId },
        status: { in: [SubOrderStatus.DELIVERED, SubOrderStatus.COMPLETED] },
      },
      include: {
        review: true,
      } as any,
    });

    if (!subOrder) {
      throw new AppError("Order not found or not completed", 400);
    }

    if ((subOrder as any).review) {
      throw new AppError("You have already reviewed this order", 400);
    }

    // 2. Create Review
    const review = await reviewRepository.createShopReview({
      rating: data.rating,
      comment: data.comment,
      userId,
      shopId: data.shopId,
      subOrderId: data.subOrderId,
    });

    // 3. Update Shop Rating
    this.updateShopRatingAggregates(data.shopId);

    return review;
  }

  async getProductReviews(
    productId: string,
    query: {
      page?: number;
      limit?: number;
      rating?: number;
      hasImages?: boolean;
    }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return reviewRepository.findProductReviews(productId, {
      page,
      limit,
      rating: query.rating,
      hasImages: query.hasImages,
    });
  }

  async getShopReviews(
    shopId: string,
    query: { page?: number; limit?: number; rating?: number }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return reviewRepository.findShopReviews(shopId, {
      page,
      limit,
      rating: query.rating,
    });
  }

  async replyProductReview(userId: string, reviewId: string, reply: string) {
    // Verify ownership (User must be the shop owner of the product)
    const review = await reviewRepository.findProductReviewById(reviewId);
    if (!review) throw new AppError("Review not found", 404);

    const product = await prisma.product.findUnique({
      where: { id: review.productId },
      select: { shop: { select: { sellerId: true } } },
    });

    if (!product || product.shop.sellerId !== userId) {
      throw new AppError(
        "You do not have permission to reply to this review",
        403
      );
    }

    return reviewRepository.replyProductReview(reviewId, reply);
  }

  async replyShopReview(userId: string, reviewId: string, reply: string) {
    const review = await reviewRepository.findShopReviewById(reviewId);
    if (!review) throw new AppError("Review not found", 404);

    const shop = await prisma.shop.findUnique({
      where: { id: review.shopId },
      select: { sellerId: true },
    });

    if (!shop || shop.sellerId !== userId) {
      throw new AppError(
        "You do not have permission to reply to this review",
        403
      );
    }

    return reviewRepository.replyShopReview(reviewId, reply);
  }

  async editProductReview(
    userId: string,
    reviewId: string,
    data: { rating?: number; comment?: string; images?: string[] }
  ) {
    const review = await reviewRepository.findProductReviewById(reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId !== userId)
      throw new AppError("You do not have permission to edit this review", 403);

    const updated = await reviewRepository.updateProductReview(reviewId, {
      rating: data.rating,
      comment: data.comment,
      images: data.images ? JSON.stringify(data.images) : undefined,
    });

    if (data.rating) {
      await this.updateProductRatingAggregates(review.productId);
    }

    return updated;
  }

  async editShopReview(
    userId: string,
    reviewId: string,
    data: { rating?: number; comment?: string }
  ) {
    const review = await reviewRepository.findShopReviewById(reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId !== userId)
      throw new AppError("You do not have permission to edit this review", 403);

    const updated = await reviewRepository.updateShopReview(reviewId, {
      rating: data.rating,
      comment: data.comment,
    });

    if (data.rating) {
      await this.updateShopRatingAggregates(review.shopId);
    }

    return updated;
  }

  async deleteProductReview(userId: string, reviewId: string) {
    const review = await reviewRepository.findProductReviewById(reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId !== userId)
      throw new AppError(
        "You do not have permission to delete this review",
        403
      );

    await reviewRepository.deleteProductReview(reviewId);
    await this.updateProductRatingAggregates(review.productId);
    return { success: true };
  }

  async deleteShopReview(userId: string, reviewId: string) {
    const review = await reviewRepository.findShopReviewById(reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId !== userId)
      throw new AppError(
        "You do not have permission to delete this review",
        403
      );

    await reviewRepository.deleteShopReview(reviewId);
    await this.updateShopRatingAggregates(review.shopId);
    return { success: true };
  }

  async reportReview(
    userId: string,
    data: { productReviewId?: string; reason: string }
  ) {
    if (!data.productReviewId) {
      throw new AppError("Product Review ID is required", 400);
    }
    // Check if review exists
    const review = await reviewRepository.findProductReviewById(
      data.productReviewId
    );
    if (!review) throw new AppError("Review not found", 404);

    return reviewRepository.createReport({
      productReview: { connect: { id: data.productReviewId } },
      reporter: { connect: { id: userId } },
      reason: data.reason,
      status: "PENDING",
    });
  }

  private async updateProductRatingAggregates(productId: string) {
    const stats = await reviewRepository.getAverageProductRating(productId);
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats.average,
        // Assuming we might want to store count but schema only has rating currently
      },
    });
  }

  private async updateShopRatingAggregates(shopId: string) {
    const aggregate = await prisma.shopReview.aggregate({
      where: { shopId, isHidden: false },
      _avg: { rating: true },
    });

    if (aggregate._avg.rating) {
      await prisma.shop.update({
        where: { id: shopId },
        data: { rating: aggregate._avg.rating },
      });
    }
  }
}
