import { Response, NextFunction } from "express";
import { sendSuccess } from "../utils/response";
import subOrderService from "../services/subOrder.service";
import { AppError } from "../errors/AppError";

export class SubOrderController {
  /**
   * Get Orders for Shop (Seller perspective)
   */
  getShopOrders = async (req: any, res: Response, next: NextFunction) => {
    try {
      // Assuming shopId is provided in params or determined from user's shop
      const { shopId } = req.params;
      const { status, page, limit } = req.query;

      // TODO: Verify if the user owns this shop

      const result = await subOrderService.getShopSubOrders(shopId, {
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update Order Status (Seller action)
   */
  updateOrderStatus = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { subOrderId } = req.params;
      const { status } = req.body;
      const { shopId } = req.body; // In real app, get from auth middleware relative to shop

      if (!status) throw new AppError("Thiếu trạng thái mới", 400);

      const result = await subOrderService.updateStatus(
        subOrderId,
        shopId,
        status
      );

      sendSuccess(
        res,
        result,
        `Đã cập nhật trạng thái đơn hàng thành ${status}`
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Shop Order Detail
   */
  getShopOrderDetail = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { subOrderId, shopId } = req.params;
      const result = await subOrderService.getShopSubOrderDetail(
        subOrderId,
        shopId
      );

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export default new SubOrderController();
