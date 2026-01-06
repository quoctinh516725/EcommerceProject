import { PrismaClient } from "@prisma/client";
import prisma from "../config/database";

class CartSnapshotRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async upsertSnapshot(userId: string, items: string): Promise<void> {
    await this.prisma.cartSnapshot.upsert({
      where: { userId },
      update: { items },
      create: { userId, items },
    });
  }

  async findSnapshot(userId: string): Promise<string | null> {
    const snapshot = await this.prisma.cartSnapshot.findUnique({
      where: { userId },
      select: { items: true },
    });
    return snapshot?.items || null;
  }
}

export default new CartSnapshotRepository();
