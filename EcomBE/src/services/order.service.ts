import prisma from "../config/database";
import inventoryService from "./inventory.service";
import cartService, { CartIdentifier } from "./cart.service";
import { AppError } from "../errors/AppError";
import crypto from "crypto";
import { calculateShopShippingFee } from "../utils/shipping";
import { PaymentStatus, SubOrderStatus } from "../constants";
import orderRepository from "../repositories/order.repository";
import subOrderRepository from "../repositories/subOrder.repository";
import paymentRepository from "../repositories/payment.repository";
import shippingRuleRepository from "../repositories/shippingRule.repository";

class OrderService {
  /**
   * Generate an order code
   */
  private generateOrderCode(prefix: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = crypto.randomInt(100, 999).toString();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create Master Order and Sub-Orders from Selected Items
   */
  async createOrder(
    userId: string,
    checkoutData: {
      items: { variantId: string; quantity: number }[];
      receiverName: string;
      receiverPhone: string;
      shippingAddress: string;
      paymentMethod: string;
    }
  ) {
    if (!checkoutData.items || checkoutData.items.length === 0) {
      throw new AppError("Danh sách sản phẩm chọn mua không được trống", 400);
    }

    // 1. Get Full Cart for verification and enrichment
    const cartIdentifier: CartIdentifier = { type: "user", id: userId };
    const allCartItems = await cartService.getCart(cartIdentifier);

    // 2. Filter and Match selected items with cart data
    const selectedVariantIds = checkoutData.items.map((i) => i.variantId);
    const orderItemsEnriched = allCartItems.filter((item: any) =>
      selectedVariantIds.includes(item.variantId)
    );
    if (orderItemsEnriched.length !== checkoutData.items.length) {
      throw new AppError("Một số sản phẩm không còn trong giỏ hàng", 400);
    }

    // Update quantities from request (in case user changed them at checkout)
    orderItemsEnriched.forEach((item: any) => {
      const selected = checkoutData.items.find(
        (i) => i.variantId === item.variantId
      );
      if (selected) item.quantity = selected.quantity;
    });

    // 3. Group items by Shop for splitting
    const shopGroups = new Map<string, any[]>();
    orderItemsEnriched.forEach((item: any) => {
      const shopId = item.shop.id;
      if (!shopGroups.has(shopId)) shopGroups.set(shopId, []);
      shopGroups.get(shopId)!.push(item);
    });

    // 4. Fetch Shipping Rules for involved shops
    const shopIds = Array.from(shopGroups.keys());
    const shippingRules = await shippingRuleRepository.findByShopIds(shopIds);
    const rulesMap = new Map(shippingRules.map((r: any) => [r.shopId, r]));

    const masterOrderCode = this.generateOrderCode("ORD");

    // 5. Atomic Database Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // a. Inventory Check & Lock
      const stockItems = orderItemsEnriched.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
      await inventoryService.lockStock(tx, stockItems);

      // b. Create Master Order (Initial)
      const masterOrder = await orderRepository.create(tx, {
        userId,
        orderCode: masterOrderCode,
        originalTotalAmount: 0, // Field updated in schema
        platformDiscount: 0, // New field in schema
        receiverName: checkoutData.receiverName,
        receiverPhone: checkoutData.receiverPhone,
        shippingAddress: checkoutData.shippingAddress,
      });

      const subOrdersInfo = [];
      let totalMasterAmount = 0;

      // c. Create Sub-Orders for each Shop
      for (const [shopId, items] of shopGroups) {
        const subOrderCode = this.generateOrderCode("SUB");

        const itemsTotal = items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0
        );

        // Fetch dynamic shipping fee
        const rule : any = rulesMap.get(shopId);
        if (!rule) {
          throw new AppError("Shop chưa cấu hình phí vận chuyển", 400);
        }

        const shopShippingFee = calculateShopShippingFee({
          rule,
          items,
          subtotal: itemsTotal,
        });

        const subOrderTotal = itemsTotal + shopShippingFee;

        const subOrder = await subOrderRepository.create(tx, {
          masterOrderId: masterOrder.id,
          shopId,
          subOrderCode,
          itemsTotal,
          shippingFee: shopShippingFee,
          totalAmount: subOrderTotal,
          status: SubOrderStatus.PENDING_PAYMENT,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.name,
              variantName: item.variantName,
              quantity: item.quantity,
              price: item.price,
              totalPrice: Number(item.price) * item.quantity,
            })),
          },
        });

        subOrdersInfo.push(subOrder);
        totalMasterAmount += subOrderTotal;
      }

      // d. Create Payment record (PENDING)
      const payment = await paymentRepository.create(tx, {
        masterOrderId: masterOrder.id,
        userId,
        paymentMethod: checkoutData.paymentMethod,
        totalAmount: totalMasterAmount,
        status: PaymentStatus.PENDING,
      });

      // e. Create Payment Allocations (Split Ledger)
      for (const sub of subOrdersInfo) {
        await paymentRepository.createAllocation(tx, {
          paymentId: payment.id,
          subOrderId: sub.id,
          amount: sub.totalAmount,
        });
      }

      // f. Finalize Master Order Amount
      await orderRepository.update(tx, masterOrder.id, {
        originalTotalAmount: totalMasterAmount,
      });

      return {
        masterOrderId: masterOrder.id,
        orderCode: masterOrder.orderCode,
        totalAmount: totalMasterAmount,
        subOrders: subOrdersInfo.length,
        paymentId: payment.id,
      };
    });
    await cartService.removeItems(cartIdentifier, selectedVariantIds);
    return result;
  }

  /**
   * Get User Order List
   */
  async getUserOrders(userId: string) {
    return orderRepository.findByUserId(userId);
  }

  /**
   * Get Single Order Detail
   */
  async getOrderDetail(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId, userId);

    if (!order) throw new AppError("Không tìm thấy đơn hàng", 404);
    return order;
  }
}

export default new OrderService();
