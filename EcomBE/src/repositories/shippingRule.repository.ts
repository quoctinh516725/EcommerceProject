import prisma from "../config/database";

class ShippingRuleRepository {
  async findByShopIds(shopIds: string[]) {
    return (prisma as any).shopShippingRule.findMany({
      where: { shopId: { in: shopIds } },
    });
  }

  async findByShopId(shopId: string) {
    return (prisma as any).shopShippingRule.findUnique({
      where: { shopId },
    });
  }
}

export default new ShippingRuleRepository();
