/**
 * Shop status constants
 */
export const ShopStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
  REJECTED: 'REJECTED',
} as const;

export type ShopStatusType = typeof ShopStatus[keyof typeof ShopStatus];

