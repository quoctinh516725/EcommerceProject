import prisma from "../config/database";

class OrderRepository {
  async create(tx: any, data: any) {
    return (tx as any).masterOrder.create({ data });
  }

  async update(tx: any, id: string, data: any) {
    return (tx as any).masterOrder.update({
      where: { id },
      data,
    });
  }

  async findById(id: string, userId: string) {
    return prisma.masterOrder.findFirst({
      where: { id, userId },
      include: {
        subOrders: {
          include: {
            shop: { select: { id: true, name: true, logoUrl: true } },
            orderItems: true,
            refunds: true,
          },
        },
        payments: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.masterOrder.findMany({
      where: { userId },
      include: {
        subOrders: {
          include: {
            shop: { select: { name: true, logoUrl: true } },
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new OrderRepository();
