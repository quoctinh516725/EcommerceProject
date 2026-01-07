import prisma from "../config/database";

export interface CreateOrderData {
  userId: string;
  orderCode: string;
  originalTotalAmount?: number;
  totalAmount?: number;
  platformDiscount?: number;
  status?: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  paymentMethod: string;
}

export interface UpdateOrderData {
  originalTotalAmount?: number;
  totalAmountAtBuy?: number;
  platformDiscount?: number;
  status?: string;
}

class OrderRepository {
  async create(tx: any, data: CreateOrderData) {
    return (tx as any).masterOrder.create({ data });
  }

  async update(tx: any, id: string, data: UpdateOrderData) {
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
