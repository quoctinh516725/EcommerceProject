export const RefundStatus = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  REFUNDED: "REFUNDED",
  REJECTED: "REJECTED",
} as const;

export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];
