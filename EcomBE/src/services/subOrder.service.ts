import { AppError } from "../errors/AppError";
import { SubOrderStatus, PaymentStatus, RefundStatus } from "../constants";
import subOrderRepository from "../repositories/subOrder.repository";
import refundRepository from "../repositories/refund.repository";
import inventoryService from "./inventory.service";
import prisma from "../config/database";

class SubOrderService {
  /**
   * Get Sub-Orders belonging to a Shop
   */
  async getShopSubOrders(
    shopId: string,
    filters: {
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const items = await subOrderRepository.findMany({
      shopId,
      status,
      skip,
      take: limit,
    });
    const total = await subOrderRepository.count({ shopId, status });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update Sub-Order Status
   */
  async updateStatus(subOrderId: string, shopId: string, newStatus: string) {
    const subOrder = await subOrderRepository.findById(subOrderId, shopId);

    if (!subOrder) {
      throw new AppError("Không tìm thấy đơn hàng của shop", 404);
    }

    // State Machine transitions
    const validTransitions: Record<string, string[]> = {
      [SubOrderStatus.PENDING_PAYMENT]: [
        SubOrderStatus.PAID,
        SubOrderStatus.CANCELLED,
      ],
      [SubOrderStatus.PAID]: [
        SubOrderStatus.PROCESSING,
        SubOrderStatus.CANCELLED,
      ],
      [SubOrderStatus.PROCESSING]: [SubOrderStatus.SHIPPING],
      [SubOrderStatus.SHIPPING]: [SubOrderStatus.DELIVERED],
      [SubOrderStatus.DELIVERED]: [SubOrderStatus.COMPLETED],
      [SubOrderStatus.COMPLETED]: [],
      [SubOrderStatus.CANCELLED]: [],
      [SubOrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[subOrder.status]?.includes(newStatus)) {
      throw new AppError(
        `Không thể chuyển trạng thái từ ${subOrder.status} sang ${newStatus}`,
        400
      );
    }

    // Transition Logic
    if (
      newStatus === SubOrderStatus.PROCESSING ||
      newStatus === SubOrderStatus.SHIPPING
    ) {
      const isPaid = (subOrder.masterOrder as any).payments.some(
        (p: any) => p.status === PaymentStatus.SUCCESS
      );
      if (!isPaid) {
        throw new AppError("Chỉ có thể xử lý đơn hàng đã thanh toán", 400);
      }
    }

    return await prisma.$transaction(async (tx: any) => {
      if (newStatus === SubOrderStatus.CANCELLED) {
        // 1. Release Inventory
        const stockItems = subOrder.orderItems.map((item: any) => ({
          variantId: item.variantId!,
          quantity: item.quantity,
        }));
        await inventoryService.releaseStock(tx, stockItems);

        // 2. If it's a paid order (not PENDING_PAYMENT), create an APPROVED refund record
        if (subOrder.status !== SubOrderStatus.PENDING_PAYMENT) {
          const paymentAllocation = (subOrder.paymentAllocations as any).find(
            (a: any) => a.payment.status === PaymentStatus.SUCCESS
          );

          if (paymentAllocation) {
            await refundRepository.create(tx, {
              subOrderId,
              paymentId: paymentAllocation.paymentId,
              amount: subOrder.totalAmount,
              reason: "Shop đã hủy đơn hàng",
              status: RefundStatus.APPROVED,
            });
          }
        }
      }

      return await subOrderRepository.update(tx, subOrderId, {
        status: newStatus,
      });
    });
  }

  /**
   * Get Detailed Sub-Order for Shop
   */
  async getShopSubOrderDetail(subOrderId: string, shopId: string) {
    const subOrder = await subOrderRepository.findById(subOrderId, shopId);
    if (!subOrder) throw new AppError("Không tìm thấy đơn hàng", 404);
    return subOrder;
  }
}

export default new SubOrderService();
