import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../utils/response";
import refundService from "../services/refund.service";
import { AppError } from "../errors/AppError";

export class RefundController {
  /**
   * Seller handles refund request (Approve or Reject)
   */
  handleRefundRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { refundId } = req.params;
      const { action } = req.body;
      const shopId = req.shop?.id;

      if (!shopId) {
        throw new AppError("Shop information not found", 401);
      }

      if (!action || !["APPROVE", "REJECT"].includes(action)) {
        throw new AppError("Hành động không hợp lệ (APPROVE hoặc REJECT)", 400);
      }

      const result = await refundService.handleRefundRequest(
        shopId,
        refundId,
        action
      );

      sendSuccess(
        res,
        result,
        action === "APPROVE"
          ? "Đã duyệt yêu cầu hủy đơn"
          : "Đã từ chối yêu cầu hủy đơn"
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new RefundController();
