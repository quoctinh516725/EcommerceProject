export const SubOrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPING: "SHIPPING",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCEL_REQUESTED: "CANCEL_REQUESTED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type SubOrderStatus =
  (typeof SubOrderStatus)[keyof typeof SubOrderStatus];
