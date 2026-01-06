import { Router } from "express";
import subOrderController from "../controllers/subOrder.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/shop/:shopId", subOrderController.getShopOrders);
router.get(
  "/detail/:subOrderId/:shopId",
  subOrderController.getShopOrderDetail
);
router.patch("/status/:subOrderId", subOrderController.updateOrderStatus);

export default router;
