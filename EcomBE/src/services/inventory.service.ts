import productVariantRepository from "../repositories/productVariant.repository";

class InventoryService {
  /**
   * Check if requested quantities are available for given variants
   */
  async checkAvailability(items: { variantId: string; quantity: number }[]) {
    const variantIds = items.map((i) => i.variantId);

    const variants = await productVariantRepository.findByIds(variantIds, {
      id: true,
      stock: true,
      variantName: true,
      product: { select: { name: true } },
    });

    const variantMap = new Map((variants as any[]).map((v) => [v.id, v]));

    for (const item of items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new Error(`Sản phẩm biến thể ID ${item.variantId} không tồn tại`);
      }
      if (variant.stock < item.quantity) {
        throw new Error(
          `Sản phẩm "${variant.product.name}${
            variant.variantName ? ` - ${variant.variantName}` : ""
          }" chỉ còn ${variant.stock} sản phẩm trong kho`
        );
      }
    }
  }

  /**
   * Decrease stock (Lock) for a list of items
   */
  async lockStock(tx: any, items: { variantId: string; quantity: number }[]) {
    for (const item of items) {
      const variant = await productVariantRepository.decrementStock(
        tx,
        item.variantId,
        item.quantity
      );

      if (variant.stock < 0) {
        throw new Error(`Kho không đủ cho biến thể ${item.variantId}`);
      }
    }
  }

  /**
   * Increase stock (Release) for a list of items
   */
  async releaseStock(
    tx: any,
    items: { variantId: string; quantity: number }[]
  ) {
    for (const item of items) {
      await productVariantRepository.incrementStock(
        tx,
        item.variantId,
        item.quantity
      );
    }
  }
}

export default new InventoryService();
