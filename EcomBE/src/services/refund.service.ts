import prisma from "../config/database";
import { AppError } from "../errors/AppError";
import inventoryService from "./inventory.service";
import { RefundStatus, SubOrderStatus, PaymentStatus } from "../constants";
import refundRepository from "../repositories/refund.repository";
import subOrderRepository from "../repositories/subOrder.repository";

class RefundService {
  /**
   * Cancel a Sub-Order (User Action or Seller Action)
   */
  async cancelSubOrder(userId: string, subOrderId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch SubOrder with Items
      const subOrder = await subOrderRepository.findById(subOrderId);

      if (!subOrder || (subOrder.masterOrder as any).userId !== userId) {
        throw new AppError("Không tìm thấy đơn hàng", 404);
      }

      // 2. Validate Cancellation State
      const cancellableStatuses = [
        SubOrderStatus.PENDING_PAYMENT,
        SubOrderStatus.PAID,
        SubOrderStatus.PROCESSING,
      ];
      if (!cancellableStatuses.includes(subOrder.status as any)) {
        throw new AppError(
          `Không thể hủy đơn hàng ở trạng thái ${subOrder.status}`,
          400
        );
      }

      // 3. Create Refund Record
      const paymentAllocation = (subOrder.paymentAllocations as any).find(
        (a: any) => a.payment.status === PaymentStatus.SUCCESS
      );

      if (subOrder.status !== SubOrderStatus.PENDING_PAYMENT) {
        if (!paymentAllocation) {
          throw new AppError("Không tìm thấy payment hợp lệ", 400);
        }

        const refund = await refundRepository.create(tx, {
          subOrderId,
          paymentId: paymentAllocation.paymentId,
          amount: subOrder.totalAmount,
          reason,
          status: RefundStatus.REQUESTED,
        });

        // Update SubOrder Status to CANCEL_REQUESTED
        const updatedSubOrder = await subOrderRepository.update(
          tx,
          subOrderId,
          {
            status: SubOrderStatus.CANCEL_REQUESTED,
          }
        );

        return {
          refundId: refund.id,
          subOrder: updatedSubOrder,
          message: "Yêu cầu hủy đơn đã được gửi và đang chờ shop duyệt",
        };
      }

      // 4. Release Inventory (Chỉ chạy cho PENDING_PAYMENT)
      const stockItems = subOrder.orderItems.map((item: any) => ({
        variantId: item.variantId!,
        quantity: item.quantity,
      }));
      await inventoryService.releaseStock(tx, stockItems);

      // 5. Update SubOrder Status
      const updatedSubOrder = await subOrderRepository.update(tx, subOrderId, {
        status: SubOrderStatus.CANCELLED,
      });

      return {
        subOrder: updatedSubOrder,
      };
    });
  }

  /**
   * Seller handles refund request (Approve or Reject)
   */
  async handleRefundRequest(
    shopId: string,
    refundId: string,
    action: "APPROVE" | "REJECT"
  ) {
    return await prisma.$transaction(async (tx) => {
      const refund = await refundRepository.findById(refundId);
      if (!refund) throw new AppError("Không tìm thấy yêu cầu hoàn tiền", 404);

      if ((refund.subOrder as any).shopId !== shopId) {
        throw new AppError("Bạn không có quyền xử lý yêu cầu này", 403);
      }

      if (refund.status !== RefundStatus.REQUESTED) {
        throw new AppError("Yêu cầu này đã được xử lý trước đó", 400);
      }

      if (action === "REJECT") {
        await subOrderRepository.update(tx, refund.subOrderId, {
          status: SubOrderStatus.PAID,
        });

        return await refundRepository.update(tx, refundId, {
          status: RefundStatus.REJECTED,
        });
      }

      // Case: APPROVE
      // 1. Release Inventory
      const stockItems = (refund.subOrder as any).orderItems.map(
        (item: any) => ({
          variantId: item.variantId!,
          quantity: item.quantity,
        })
      );
      await inventoryService.releaseStock(tx, stockItems);

      // 2. Update SubOrder Status
      await subOrderRepository.update(tx, refund.subOrderId, {
        status: SubOrderStatus.CANCELLED,
      });

      // 3. Update Refund Status
      return await refundRepository.update(tx, refundId, {
        status: RefundStatus.APPROVED,
      });
    });
  }
}

export default new RefundService();
