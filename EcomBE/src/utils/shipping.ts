import { ShopShippingRule } from "@prisma/client";

export interface ShippingItem {
  quantity: number;
}

/**
 * Calculate shipping fee based on shop rules
 */
export function calculateShopShippingFee({
  rule,
  items,
  subtotal,
}: {
  rule: ShopShippingRule | null | undefined;
  items: ShippingItem[];
  subtotal: number;
}): number {
  // If no rule exists, use a default fallback (e.g., 15000 as previously used)
  if (!rule) {
    return 15000;
  }

  // Check for free shipping minimum
  if (rule.freeShipMin && subtotal >= Number(rule.freeShipMin)) {
    return 0;
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // baseFee + (itemCount * extraPerItem)
  const baseFee = Number(rule.baseFee);
  const extraPerItem = Number(rule.extraPerItem);

  return baseFee + itemCount * extraPerItem;
}
