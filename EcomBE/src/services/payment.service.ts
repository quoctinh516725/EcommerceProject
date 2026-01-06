import { env } from "process";
import prisma from "../config/database";
import { AppError } from "../errors/AppError";
import crypto from "crypto";
import { PaymentStatus, SubOrderStatus } from "../constants";
import paymentRepository from "../repositories/payment.repository";
import subOrderRepository from "../repositories/subOrder.repository";

class PaymentService {
  /**
   * Create VNPay Payment URL (Mock/Implementation logic)
   */
  async createVNPayUrl(paymentId: string, amount: number, ipAddress: string) {
    const vnp_TmnCode = env.VNPAY_TMN_CODE;
    const vnp_HashSecret = env.VNPAY_HASH_SECRET;
    const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnp_ReturnUrl = "http://localhost:3000/api/v1/payments/vnpay-return";

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    const vnp_Params: any = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: paymentId,
      vnp_OrderInfo: `Thanh toan don hang ${paymentId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // VNPay expects amount in cents
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: createDate,
    };

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((obj: any, key) => {
        obj[key] = vnp_Params[key];
        return obj;
      }, {});

    const querystring = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", vnp_HashSecret || "");
    const signed = hmac.update(Buffer.from(querystring, "utf-8")).digest("hex");

    return `${vnp_Url}?${querystring}&vnp_SecureHash=${signed}`;
  }

  /**
   * Handle Successful Payment (Internal Split Logic)
   */
  async handleSuccessfulPayment(
    paymentId: string,
    transactionId: string,
    _rawResponse: any
  ) {
    return await prisma.$transaction(async (tx) => {
      const payment = await paymentRepository.findById(paymentId, true);

      if (!payment) throw new AppError("Không tìm thấy giao dịch", 404);
      if (payment.status === PaymentStatus.SUCCESS) return payment; // Idempotency

      // 1. Update Payment Status
      const updatedPayment = await paymentRepository.update(tx, paymentId, {
        status: PaymentStatus.SUCCESS,
        transactionId,
        paidAt: new Date(),
      });

      // 2. Update all associated SubOrders via Allocations
      for (const allocation of (payment as any).allocations) {
        await subOrderRepository.update(tx, allocation.subOrderId, {
          status: SubOrderStatus.PAID,
        });
      }

      return updatedPayment;
    });
  }

  /**
   * Handle Failed Payment
   */
  async handleFailedPayment(paymentId: string, _rawResponse: any) {
    return await prisma.$transaction(async (tx) => {
      const payment = await paymentRepository.findById(paymentId, true);

      if (!payment) throw new AppError("Không tìm thấy giao dịch", 404);
      if (
        payment.status === PaymentStatus.FAILED ||
        payment.status === PaymentStatus.SUCCESS
      )
        return payment;

      // 1. Update Payment Status
      const updatedPayment = await paymentRepository.update(tx, paymentId, {
        status: PaymentStatus.FAILED,
      });

      return updatedPayment;
    });
  }
}

export default new PaymentService();
