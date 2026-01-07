import prisma from "../config/database";

export interface CreateVoucherData {
  code: string;
  name: string;
  description?: string;
  type: string;
  shopId?: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  perUserLimit?: number;
  startDate: Date;
  endDate: Date;
}

class VoucherRepository {
  /**
   * Create a new voucher
   */
  async create(tx: any, data: CreateVoucherData) {
    const client = tx || prisma;
    return (client as any).voucher.create({ data });
  }

  /**
   * Find voucher by code
   */
  async findByCode(code: string) {
    return prisma.voucher.findUnique({
      where: { code },
      include: { shop: true },
    });
  }

  /**
   * Find vouchers by shop ID
   */
  async findByShopId(shopId: string) {
    return prisma.voucher.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all platform vouchers
   */
  async findPlatformVouchers() {
    return prisma.voucher.findMany({
      where: { type: "PLATFORM" },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update voucher
   */
  async update(id: string, data: Partial<CreateVoucherData>) {
    return prisma.voucher.update({
      where: { id },
      data,
    });
  }

  /**
   * Increment usage count
   */
  async incrementUsage(tx: any, voucherId: string) {
    const client = tx || prisma;
    return (client as any).voucher.update({
      where: { id: voucherId },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Decrement usage count
   */
  async decrementUsage(tx: any, voucherId: string) {
    const client = tx || prisma;
    return (client as any).voucher.update({
      where: { id: voucherId },
      data: { usageCount: { decrement: 1 } },
    });
  }

  /**
   * Create voucher usage record
   */
  async createUsage(
    tx: any,
    data: {
      voucherId: string;
      userId: string;
      masterOrderId: string;
      discountApplied: number;
    }
  ) {
    const client = tx || prisma;
    return (client as any).voucherUsage.create({ data });
  }

  /**
   * Check if user has used voucher for this order
   */
  async findUsage(voucherId: string, masterOrderId: string) {
    return prisma.voucherUsage.findUnique({
      where: {
        voucherId_masterOrderId: {
          voucherId,
          masterOrderId,
        },
      },
    });
  }

  /**
   * Count user's usage of a voucher
   */
  async countUserUsage(voucherId: string, userId: string) {
    return prisma.voucherUsage.count({
      where: { voucherId, userId },
    });
  }

  /**
   * Delete usage by master order ID
   */
  async deleteUsageByMasterOrderId(tx: any, masterOrderId: string) {
    const client = tx || prisma;
    return (client as any).voucherUsage.deleteMany({
      where: { masterOrderId },
    });
  }

  /**
   * Find usage by master order ID
   */
  async findByMasterOrderId(masterOrderId: string) {
    return prisma.voucherUsage.findFirst({
      where: { masterOrderId },
    });
  }
}

export default new VoucherRepository();
