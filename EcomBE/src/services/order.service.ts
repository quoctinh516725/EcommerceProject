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
import voucherService from "./voucher.service";
import adminService from "./admin.service";
import shopRepository from "../repositories/shop.repository";
import { DEFAULT_COMMISSION_RATE } from "../constants/system";

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
      voucherCode?: string;
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
        paymentMethod: checkoutData.paymentMethod,
      });

      const subOrdersInfo = [];
      let totalMasterAmount = 0;
      let totalPlatformDiscount = 0;
      let originalTotalAccumulator = 0; // Sum of (items + shipping - shop_discount)

      // Validate voucher if provided
      let voucherValidation: any = null;
      if (checkoutData.voucherCode) {
        const masterTotal = orderItemsEnriched.reduce(
          (sum: number, item: any) => sum + Number(item.price) * item.quantity,
          0
        );
        voucherValidation = await voucherService.validateAndCalculate(
          checkoutData.voucherCode,
          userId,
          masterTotal
        );

        if (!voucherValidation.isValid) {
          throw new AppError(
            voucherValidation.error || "Mã voucher không hợp lệ",
            400
          );
        }
      }

      // Get default commission rate
      const defaultCommissionRateValue = (await adminService.getSetting(
        "DEFAULT_COMMISSION_RATE",
        DEFAULT_COMMISSION_RATE.toString()
      )) as string;
      const defaultCommissionRate = parseFloat(defaultCommissionRateValue);
      const masterItemsTotal = orderItemsEnriched.reduce(
        (sum: number, item: any) => sum + Number(item.price) * item.quantity,
        0
      );
      // c. Create Sub-Orders for each Shop
      for (const [shopId, items] of shopGroups) {
        const subOrderCode = this.generateOrderCode("SUB");

        const itemsTotal = items.reduce(
          (sum: number, item: any) => sum + Number(item.price) * item.quantity,
          0
        );

        // Fetch dynamic shipping fee
        const rule: any = rulesMap.get(shopId);
        if (!rule) {
          throw new AppError("Shop chưa cấu hình phí vận chuyển", 400);
        }

        const shopShippingFee = calculateShopShippingFee({
          rule,
          items,
          subtotal: itemsTotal,
        });

        // Calculate shop-specific discount (if voucher is SHOP type)
        let totalShopDiscount = 0;
        if (
          voucherValidation?.isValid &&
          voucherValidation.voucher.type === "SHOP" &&
          voucherValidation.voucher.shopId === shopId
        ) {
          totalShopDiscount += voucherValidation.discountAmount;
        }

        // Calculate platform discount allocation (if voucher is PLATFORM type)
        let platformDiscountShare = 0;
        if (
          voucherValidation?.isValid &&
          voucherValidation.voucher.type === "PLATFORM"
        ) {
          platformDiscountShare =
            (itemsTotal / masterItemsTotal) * voucherValidation.discountAmount;
          totalPlatformDiscount += platformDiscountShare;
        }

        const subTotalDiscount = totalShopDiscount + platformDiscountShare;

        // Get commission rate (shop-specific or default)
        const shop = await shopRepository.findById(shopId);
        const commissionRate = shop?.commissionRate
          ? Number(shop.commissionRate)
          : defaultCommissionRate;

        // 1. Calculate Commission based on price AFTER SHOP DISCOUNT (Fairer for shop)
        const itemsTotalAfterShopDiscount = itemsTotal - totalShopDiscount;
        const commissionAmount = itemsTotalAfterShopDiscount * commissionRate;

        // 2. Calculate Real Amount (Shop Net)
        // Note: Shop SHOULD NOT bear the platform discount. Platform covers it.
        const realAmount =
          itemsTotalAfterShopDiscount - commissionAmount + shopShippingFee;

        // 3. User Pays (SubTotal)
        const subOrderTotal =
          itemsTotalAfterShopDiscount + shopShippingFee - platformDiscountShare;

        const subOrder = await subOrderRepository.create(tx, {
          masterOrderId: masterOrder.id,
          shopId,
          subOrderCode,
          itemsTotal,
          shippingFee: shopShippingFee,
          discountAmount: subTotalDiscount,
          commissionAmount,
          realAmount,
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
        originalTotalAccumulator += itemsTotal + shopShippingFee;
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

      // f. Finalize Master Order Amounts
      await orderRepository.update(tx, masterOrder.id, {
        originalTotalAmount: originalTotalAccumulator,
        platformDiscount: totalPlatformDiscount,
        totalAmountAtBuy: totalMasterAmount,
      });

      // g. Record voucher usage if applicable
      if (voucherValidation?.isValid) {
        await voucherService.applyVoucher(
          tx,
          voucherValidation.voucher.id,
          userId,
          masterOrder.id,
          voucherValidation.discountAmount
        );
      }

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
