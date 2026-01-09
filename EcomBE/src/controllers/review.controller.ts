import { Request, Response, NextFunction } from "express";
import { ReviewService } from "../services/review.service";
import { sendSuccess } from "../utils/response";

const reviewService = new ReviewService();

export class ReviewController {
  createProductReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const review = await reviewService.createProductReview(userId, req.body);
      sendSuccess(res, review, "Create product review successfully");
    } catch (error) {
      next(error);
    }
  };

  createShopReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const review = await reviewService.createShopReview(userId, req.body);
      sendSuccess(res, review, "Create shop review successfully");
    } catch (error) {
      next(error);
    }
  };

  getProductReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { productId } = req.params;
      const result = await reviewService.getProductReviews(
        productId,
        req.query
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getShopReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shopId } = req.params;
      const result = await reviewService.getShopReviews(shopId, req.query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  replyProductReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { reply } = req.body;
      const result = await reviewService.replyProductReview(userId, id, reply);
      sendSuccess(res, result, "Reply to review successfully");
    } catch (error) {
      next(error);
    }
  };

  replyShopReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { reply } = req.body;
      const result = await reviewService.replyShopReview(userId, id, reply);
      sendSuccess(res, result, "Reply to review successfully");
    } catch (error) {
      next(error);
    }
  };

  editProductReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await reviewService.editProductReview(
        userId,
        id,
        req.body
      );
      sendSuccess(res, result, "Update review successfully");
    } catch (error) {
      next(error);
    }
  };

  editShopReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await reviewService.editShopReview(userId, id, req.body);
      sendSuccess(res, result, "Update review successfully");
    } catch (error) {
      next(error);
    }
  };

  deleteProductReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await reviewService.deleteProductReview(userId, id);
      sendSuccess(res, null, "Delete review successfully");
    } catch (error) {
      next(error);
    }
  };

  deleteShopReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await reviewService.deleteShopReview(userId, id);
      sendSuccess(res, null, "Delete review successfully");
    } catch (error) {
      next(error);
    }
  };

  reportReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await reviewService.reportReview(userId, req.body);
      sendSuccess(res, result, "Report review successfully");
    } catch (error) {
      next(error);
    }
  };
}
