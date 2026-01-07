import { AppError } from "../errors/AppError";
import voucherRepository, {
  CreateVoucherData,
} from "../repositories/voucher.repository";

interface VoucherValidationResult {
  isValid: boolean;
  voucher?: any;
  discountAmount: number;
  error?: string;
}

class VoucherService {
  /**
   * Validate and calculate discount for a voucher
   */
  async validateAndCalculate(
    code: string,
    userId: string,
    orderTotal: number,
    shopId?: string
  ): Promise<VoucherValidationResult> {
    // 1. Find voucher by code
    const voucher = await voucherRepository.findByCode(code);

    if (!voucher) {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Mã giảm giá không tồn tại",
      };
    }

    // 2. Check if voucher is active
    if (voucher.status !== "ACTIVE") {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Mã giảm giá không còn hiệu lực",
      };
    }

    // 3. Check date validity
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng",
      };
    }

    // 4. Check usage limit (global)
    if (voucher.usageCount >= voucher.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Mã giảm giá đã hết lượt sử dụng",
      };
    }

    // 4.1 Check usage limit (per user)
    const userUsageCount = await voucherRepository.countUserUsage(
      voucher.id,
      userId
    );
    if (userUsageCount >= (voucher.perUserLimit)) {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Bạn đã hết lượt sử dụng mã giảm giá này",
      };
    }

    // 5. Check shop matching (for SHOP type vouchers)
    if (voucher.type === "SHOP" && voucher.shopId !== shopId) {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Mã giảm giá không áp dụng cho shop này",
      };
    }

    // 6. Check minimum order value
    if (voucher.minOrderValue && orderTotal < Number(voucher.minOrderValue)) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Đơn hàng tối thiểu ${voucher.minOrderValue}đ để sử dụng mã này`,
      };
    }

    // 7. Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === "PERCENT") {
      discountAmount = (orderTotal * Number(voucher.discountValue)) / 100;

      // Apply max discount cap if exists
      if (voucher.maxDiscountAmount) {
        discountAmount = Math.min(
          discountAmount,
          Number(voucher.maxDiscountAmount)
        );
      }
    } else {
      // FIXED discount
      discountAmount = Number(voucher.discountValue);
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      isValid: true,
      voucher,
      discountAmount,
    };
  }

  /**
   * Apply voucher to an order (record usage)
   */
  async applyVoucher(
    tx: any,
    voucherId: string,
    userId: string,
    masterOrderId: string,
    discountApplied: number
  ) {
    // Increment usage count
    await voucherRepository.incrementUsage(tx, voucherId);

    // Create usage record
    await voucherRepository.createUsage(tx, {
      voucherId,
      userId,
      masterOrderId,
      discountApplied,
    });
  }

  /**
   * Rollback voucher usage (when order is cancelled before payment)
   */
  async rollbackVoucherUsage(tx: any, masterOrderId: string) {
    // 1. Find the usage record
    const usage = await voucherRepository.findByMasterOrderId(masterOrderId);
    if (!usage) return; // No voucher used for this order

    // 2. Decrement usage count
    await voucherRepository.decrementUsage(tx, usage.voucherId);

    // 3. Delete usage records for this order
    await voucherRepository.deleteUsageByMasterOrderId(tx, masterOrderId);
  }

  /**
   * Create a new voucher (for Admin or Seller)
   */
  async createVoucher(data: CreateVoucherData, creatorShopId?: string) {
    // Validate voucher code uniqueness
    const existing = await voucherRepository.findByCode(data.code);
    if (existing) {
      throw new AppError("Mã voucher đã tồn tại", 400);
    }

    // Set type and shopId based on creator
    const voucherData: CreateVoucherData = {
      ...data,
      type: creatorShopId ? "SHOP" : "PLATFORM",
      shopId: creatorShopId || null,
    };

    return await voucherRepository.create(null, voucherData);
  }

  /**
   * Get vouchers for a shop
   */
  async getShopVouchers(shopId: string) {
    return await voucherRepository.findByShopId(shopId);
  }

  /**
   * Get all platform vouchers
   */
  async getPlatformVouchers() {
    return await voucherRepository.findPlatformVouchers();
  }
}

export default new VoucherService();
