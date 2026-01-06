import { Response, NextFunction } from "express";
import { sendSuccess } from "../utils/response";
import orderService from "../services/order.service";
import refundService from "../services/refund.service";

export class OrderController {
  /**
   * Post Checkout
   */
  checkout = async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId;
      const checkoutData = {
        items: req.body.items, 
        receiverName: req.body.receiverName,
        receiverPhone: req.body.receiverPhone,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod || "VNPAY",
      };

      const result = await orderService.createOrder(userId, checkoutData);
      sendSuccess(res, result, "Đặt hàng thành công", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get My Orders
   */
  getMyOrders = async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId;
      const orders = await orderService.getUserOrders(userId);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Order Detail
   */
  getOrderDetail = async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId;
      const { orderId } = req.params;

      const order = await orderService.getOrderDetail(userId, orderId);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel Sub Order
   */
  cancelSubOrder = async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId;
      const { subOrderId } = req.params;
      const { reason } = req.body;

      const result = await refundService.cancelSubOrder(
        userId,
        subOrderId,
        reason
      );

      sendSuccess(res, result, "Đã gửi yêu cầu hủy đơn hàng");
    } catch (error) {
      next(error);
    }
  };
}

export default new OrderController();
