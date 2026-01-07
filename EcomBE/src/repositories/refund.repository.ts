import prisma from "../config/database";

export interface CreateRefundData {
  subOrderId: string;
  paymentId?: string;
  amount: number | any;
  reason?: string;
  status?: string;
}

export interface UpdateRefundData {
  status?: string;
  reason?: string;
  amount?: number;
}

class RefundRepository {
  async create(tx: any, data: CreateRefundData) {
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

  async update(tx: any, id: string, data: UpdateRefundData) {
    const client = tx || prisma;
    return (client as any).refund.update({
      where: { id },
      data,
    });
  }
}

export default new RefundRepository();
