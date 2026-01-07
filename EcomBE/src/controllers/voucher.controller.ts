import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../utils/response";
import voucherService from "../services/voucher.service";

export class VoucherController {
  /**
   * Admin: Create platform voucher
   */
  createPlatformVoucher = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const voucher = await voucherService.createVoucher(req.body);
      sendSuccess(res, voucher, "Tạo voucher toàn sàn thành công", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin: Get all platform vouchers
   */
  getPlatformVouchers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vouchers = await voucherService.getPlatformVouchers();
      sendSuccess(res, vouchers, "Lấy danh sách voucher thành công");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Seller: Create shop voucher
   */
  createShopVoucher = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const shopId = req.shop?.id;
      if (!shopId) {
        throw new Error("Shop information not found");
      }

      const voucher = await voucherService.createVoucher(req.body, shopId);
      sendSuccess(res, voucher, "Tạo voucher shop thành công", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Seller: Get shop vouchers
   */
  getShopVouchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shopId = req.shop?.id;
      if (!shopId) {
        throw new Error("Shop information not found");
      }

      const vouchers = await voucherService.getShopVouchers(shopId);
      sendSuccess(res, vouchers, "Lấy danh sách voucher thành công");
    } catch (error) {
      next(error);
    }
  };
}

export default new VoucherController();
