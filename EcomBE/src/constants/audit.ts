export const AuditAction = {
  // System Settings
  UPDATE_SYSTEM_SETTING: "UPDATE_SYSTEM_SETTING",
  DELETE_SYSTEM_SETTING: "DELETE_SYSTEM_SETTING",

  // Product
  APPROVE_PRODUCT: "APPROVE_PRODUCT",
  REJECT_PRODUCT: "REJECT_PRODUCT",
  BAN_PRODUCT: "BAN_PRODUCT",

  // Shop
  APPROVE_SHOP: "APPROVE_SHOP",
  REJECT_SHOP: "REJECT_SHOP",
  BAN_SHOP: "BAN_SHOP",
  ACTIVATE_SHOP: "ACTIVATE_SHOP", // Unban
  UPDATE_SHOP_STATUS: "UPDATE_SHOP_STATUS",

  // User
  LOCK_USER: "LOCK_USER",
  UNLOCK_USER: "UNLOCK_USER",
  UPDATE_USER_STATUS: "UPDATE_USER_STATUS",
} as const;

export const AuditResource = {
  SYSTEM_SETTING: "system_setting",
  PRODUCT: "product",
  SHOP: "shop",
  USER: "user",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export type AuditResource = (typeof AuditResource)[keyof typeof AuditResource];

