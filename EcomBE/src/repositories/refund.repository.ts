import prisma from "../config/database";

class RefundRepository {
  async create(tx: any, data: any) {
    return (tx as any).refund.create({ data });
  }

  async findBySubOrderId(subOrderId: string) {
    return prisma.refund.findMany({
      where: { subOrderId },
    });
  }

  async findById(id: string) {
    return prisma.refund.findUnique({
      where: { id },
      include: {
        subOrder: {
          include: { orderItems: true },
        },
      },
    });
  }

  async update(tx: any, id: string, data: any) {
    const client = tx || prisma;
    return (client as any).refund.update({
      where: { id },
      data,
    });
  }
}

export default new RefundRepository();
