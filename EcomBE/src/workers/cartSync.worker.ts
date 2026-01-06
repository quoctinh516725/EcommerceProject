import redis from "../config/redis";
import cartSnapshotRepository from "../repositories/cartSnapshot.repository";

class CartSyncWorker {
  private readonly IDLE_THRESHOLD = 1000 * 60 * 5; // 5 minutes
  private readonly BATCH_SIZE = 100;
  private isRunning = false;

  start() {
    console.log("Starting CartSyncWorker...");
    // Run every minute
    setInterval(() => this.syncIdleCarts(), 60 * 1000);
  }

  async syncIdleCarts() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      let cursor = "0";
      do {
        // Scan for cart keys
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          "cart:*",
          "COUNT",
          this.BATCH_SIZE
        );
        cursor = nextCursor;

        for (const key of keys) {
          try {
            // ONLY sync authenticated user carts. Ignore guest carts.
            if (key.startsWith("cart:guest:")) continue;

            const userId = key.split(":")[1];
            if (!userId) continue;

            const lastActivityStr = await redis.hget(key, "lastActivity");
            if (!lastActivityStr) continue;

            const lastActivity = parseInt(lastActivityStr, 10);
            const now = Date.now();

            if (now - lastActivity > this.IDLE_THRESHOLD) {
              const rawItems = await redis.hgetall(key);
              const items: Record<string, number> = {};

              Object.keys(rawItems).forEach((k) => {
                if (k !== "lastActivity") {
                  items[k] = parseInt(rawItems[k], 10);
                }
              });

              if (Object.keys(items).length > 0) {
                await cartSnapshotRepository.upsertSnapshot(
                  userId,
                  JSON.stringify(items)
                );
              }
            }
          } catch (err) {
            console.error(`Failed to sync cart key ${key}`, err);
          }
        }
      } while (cursor !== "0");
    } catch (error) {
      console.error("CartSyncWorker error:", error);
    } finally {
      this.isRunning = false;
    }
  }
}

export default new CartSyncWorker();
