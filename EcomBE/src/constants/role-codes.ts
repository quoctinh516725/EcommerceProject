export const RoleCode = {
  ADMIN: "ADMIN",
  USER: "USER",
  SELLER: "SELLER",
  STAFF: "STAFF",
  GUEST: "GUEST",
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];
