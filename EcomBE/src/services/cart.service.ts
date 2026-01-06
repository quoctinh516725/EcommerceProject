import redis from "../config/redis";
import cartSnapshotRepository from "../repositories/cartSnapshot.repository";
import prisma from "../config/database";

export interface CartIdentifier {
  type: "user" | "guest";
  id: string;
}

class CartService {
  private readonly CART_TTL = 60 * 60 * 24 * 30; // 30 days

  private getRedisKey(identifier: CartIdentifier): string {
    return identifier.type === "user"
      ? `cart:${identifier.id}`
      : `cart:guest:${identifier.id}`;
  }

  /**
   * Get cart items.
   * Logic: Redis -> (if user & miss) DB Snapshot -> Enrich with Product Info
   */
  async getCart(identifier: CartIdentifier): Promise<any> {
    const cartKey = this.getRedisKey(identifier);

    // 1. Try Redis
    let rawItems = await redis.hgetall(cartKey);
    let items: Record<string, number> = {};

    // 2. Hydrate from DB if Redis missed but Snapshot exists
    if (Object.keys(rawItems).length === 0 && identifier.type === "user") {
      const snapshot = await cartSnapshotRepository.findSnapshot(identifier.id);
      if (snapshot) {
        try {
          items = JSON.parse(snapshot);
          if (Object.keys(items).length > 0) {
            await redis.hset(cartKey, items);
          }
        } catch (e) {
          console.error("Failed to parse cart snapshot", e);
        }
      }
    } else {
      // Parse quantities from Redis (they come as strings)
      Object.keys(rawItems).forEach((key) => {
        if (key !== "lastActivity") {
          items[key] = parseInt(rawItems[key]);
        }
      });
    }

    // Update activity
    await redis.hset(cartKey, "lastActivity", Date.now());
    await redis.expire(cartKey, this.CART_TTL);

    if (Object.keys(items).length === 0) {
      return [];
    }

    // 3. Enrich with Product/Variant Info
    const variantIds = Object.keys(items);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            name: true,
            thumbnailUrl: true,
            originalPrice: true,
            slug: true,
            shop: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    // Map enriched data
    const enrichedCart = variants.map((variant) => {
      const quantity = items[variant.id] || 0;
      return {
        variantId: variant.id,
        productId: variant.productId,
        name: variant.product.name,
        variantName: variant.variantName,
        sku: variant.sku,
        price: variant.price,
        originalPrice: variant.product.originalPrice,
        thumbnailUrl: variant.imageUrl || variant.product.thumbnailUrl,
        slug: variant.product.slug,
        quantity: quantity,
        subtotal: Number(variant.price) * quantity,
        stock: variant.stock,
        shop: variant.product.shop,
      };
    });

    return enrichedCart;
  }

  async addToCart(
    identifier: CartIdentifier,
    variantId: string,
    quantity: number
  ): Promise<void> {
    const cartKey = this.getRedisKey(identifier);

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    if (!variant) throw new Error("Variant not found");

    const currentQtyStr = await redis.hget(cartKey, variantId);
    const currentQty = currentQtyStr ? parseInt(currentQtyStr, 10) : 0;

    if (currentQty + quantity > variant.stock) {
      throw new Error("Quantity exceeds stock");
    }

    await redis.hincrby(cartKey, variantId, quantity);
    await redis.hset(cartKey, "lastActivity", Date.now());
    await redis.expire(cartKey, this.CART_TTL);
  }

  async updateQuantity(
    identifier: CartIdentifier,
    variantId: string,
    quantity: number
  ): Promise<void> {
    const cartKey = this.getRedisKey(identifier);
    if (quantity <= 0) {
      await this.removeItem(identifier, variantId);
      return;
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    if (!variant) throw new Error("Variant not found");
    if (quantity > variant.stock) throw new Error("Quantity exceeds stock");

    await redis.hset(cartKey, variantId, quantity);
    await redis.hset(cartKey, "lastActivity", Date.now());
    await redis.expire(cartKey, this.CART_TTL);
  }

  async removeItem(
    identifier: CartIdentifier,
    variantId: string
  ): Promise<void> {
    const cartKey = this.getRedisKey(identifier);
    await redis.hdel(cartKey, variantId);
    await redis.hset(cartKey, "lastActivity", Date.now());
    await redis.expire(cartKey, this.CART_TTL);
  }

  async removeItems(
    identifier: CartIdentifier,
    variantIds: string[]
  ): Promise<void> {
    if (variantIds.length === 0) return;
    const cartKey = this.getRedisKey(identifier);
    await redis.hdel(cartKey, ...variantIds);
    await redis.hset(cartKey, "lastActivity", Date.now());
    await redis.expire(cartKey, this.CART_TTL);
  }

  async clearCart(identifier: CartIdentifier): Promise<void> {
    const cartKey = this.getRedisKey(identifier);
    await redis.del(cartKey);
  }
}

export default new CartService();
