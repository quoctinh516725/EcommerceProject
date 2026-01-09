import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get("/products/:productId", reviewController.getProductReviews);
router.get("/shops/:shopId", reviewController.getShopReviews);

// Protected routes
router.use(authenticate);
router.post("/product", reviewController.createProductReview); // POST /reviews/product
router.post("/shop", reviewController.createShopReview); // POST /reviews/shop

router.put("/product/:id", reviewController.editProductReview);
router.put("/shop/:id", reviewController.editShopReview);

router.delete("/product/:id", reviewController.deleteProductReview);
router.delete("/shop/:id", reviewController.deleteShopReview);

router.post("/report", reviewController.reportReview);

router.post("/product/:id/reply", reviewController.replyProductReview);
router.post("/shop/:id/reply", reviewController.replyShopReview);

export default router;
