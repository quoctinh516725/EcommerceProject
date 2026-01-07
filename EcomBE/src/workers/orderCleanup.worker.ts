import prisma from "../config/database";
import { SubOrderStatus, PaymentStatus } from "../constants";
import paymentRepository from "../repositories/payment.repository";
import subOrderRepository from "../repositories/subOrder.repository";
import inventoryService from "../services/inventory.service";
import voucherService from "../services/voucher.service";

class OrderCleanupWorker {
  private readonly EXPIRATION_THRESHOLD = 1000 * 60 * 15; // 15 minutes
  private isRunning = false;

  start() {
    console.log("Starting OrderCleanupWorker...");
    // Run every 5 minutes
    setInterval(() => this.cleanupExpiredOrders(), 5 * 60 * 1000);
  }

  async cleanupExpiredOrders() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const expirationTime = new Date(Date.now() - this.EXPIRATION_THRESHOLD);

      // Find SubOrders that are PENDING_PAYMENT and older than threshold
      const expiredSubOrders = await prisma.subOrder.findMany({
        where: {
          status: SubOrderStatus.PENDING_PAYMENT,
          createdAt: {
            lt: expirationTime,
          },
        },
        include: {
          orderItems: true,
        },
      });

      if (expiredSubOrders.length === 0) return;

      console.log(
        `Cleaning up ${expiredSubOrders.length} expired sub-orders...`
      );

      for (const subOrder of expiredSubOrders) {
        try {
          await prisma.$transaction(async (tx) => {
            // 1. Release Inventory
            const stockItems = subOrder.orderItems.map((item: any) => ({
              variantId: item.variantId!,
              quantity: item.quantity,
            }));
            await inventoryService.releaseStock(tx, stockItems);

            // 2. Update SubOrder Status
            await subOrderRepository.update(tx, subOrder.id, {
              status: SubOrderStatus.CANCELLED,
            });

            // 3. Rollback Voucher Usage (if any)
            await voucherService.rollbackVoucherUsage(
              tx,
              subOrder.masterOrderId
            );

            // 4. Update associated Payment to EXPIRED (if exists and still PENDING)
            // Note: Each SubOrder is linked to one Payment via Allocation
            const allocations = await prisma.paymentAllocation.findMany({
              where: { subOrderId: subOrder.id },
              include: { payment: true },
            });

            for (const allocation of allocations) {
              if (allocation.payment.status === PaymentStatus.PENDING) {
                await paymentRepository.update(tx, allocation.paymentId, {
                  status: PaymentStatus.EXPIRED,
                });
              }
            }
          });
          console.log(
            `Successfully cancelled expired sub-order: ${subOrder.id}`
          );
        } catch (err) {
          console.error(`Failed to cleanup sub-order ${subOrder.id}:`, err);
        }
      }
    } catch (error) {
      console.error("OrderCleanupWorker error:", error);
    } finally {
      this.isRunning = false;
    }
  }
}

export default new OrderCleanupWorker();
