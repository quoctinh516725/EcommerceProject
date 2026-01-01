/**
 * Product status constants
 */
export const ProductStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REJECTED: 'REJECTED',
  BANNED: 'BANNED',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus];

