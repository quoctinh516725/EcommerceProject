import { Router } from "express";
import paymentController from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/vnpay-url/:paymentId",
  authenticate,
  paymentController.getPaymentUrl
);
router.get("/vnpay-return", paymentController.vnpayReturn);
router.get("/vnpay-ipn", paymentController.vnpayIPN);

export default router;
