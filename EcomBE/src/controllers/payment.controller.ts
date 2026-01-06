import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../utils/response";
import paymentService from "../services/payment.service";
import prisma from "../config/database";
import { AppError } from "../errors/AppError";
import { PaymentStatus } from "../constants";

export class PaymentController {
  /**
   * Get Payment URL for a Payment record
   */
  getPaymentUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;
      const ipAddress = req.ip || "127.0.0.1";

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) throw new AppError("Không tìm thấy giao dịch", 404);
      if (payment.status !== PaymentStatus.PENDING)
        throw new AppError("Giao dịch không ở trạng thái chờ", 400);

      const paymentUrl = await paymentService.createVNPayUrl(
        payment.id,
        Number(payment.totalAmount),
        ipAddress
      );

      sendSuccess(res, { paymentUrl });
    } catch (error) {
      next(error);
    }
  };

  /**
   * VNPay Return URL (Customer redirect)
   */
  vnpayReturn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vnp_Params = req.query;
      const paymentId = vnp_Params["vnp_TxnRef"] as string;
      const responseCode = vnp_Params["vnp_ResponseCode"] as string;
      const transactionNo = vnp_Params["vnp_TransactionNo"] as string;

      if (responseCode === "00") {
        await paymentService.handleSuccessfulPayment(
          paymentId,
          transactionNo,
          vnp_Params
        );
        // Redirect to success page in frontend
        res.redirect(
          `http://localhost:5173/checkout/success?orderId=${paymentId}`
        );
      } else {
        await paymentService.handleFailedPayment(paymentId, vnp_Params);
        // Redirect to failure page
        res.redirect(
          `http://localhost:5173/checkout/failure?orderId=${paymentId}`
        );
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * VNPay IPN (Server-to-Server Callback)
   */
  vnpayIPN = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vnp_Params = req.query;
      const paymentId = vnp_Params["vnp_TxnRef"] as string;
      const responseCode = vnp_Params["vnp_ResponseCode"] as string;
      const transactionNo = vnp_Params["vnp_TransactionNo"] as string;

      // TODO: Verify secure hash here!

      if (responseCode === "00") {
        await paymentService.handleSuccessfulPayment(
          paymentId,
          transactionNo,
          vnp_Params
        );
      } else {
        await paymentService.handleFailedPayment(paymentId, vnp_Params);
      }

      res.status(200).json({ RspCode: "00", Message: "Success" });
    } catch (error) {
      next(error);
    }
  };
}

export default new PaymentController();
