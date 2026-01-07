import prisma from "../config/database";

export interface CreateSubOrderData {
  masterOrderId: string;
  shopId: string;
  subOrderCode: string;
  itemsTotal: number;
  shippingFee?: number;
  discountAmount?: number;
  commissionAmount?: number;
  realAmount?: number;
  totalAmount: number;
  status?: string;
  orderItems?: any; // Consider refining further if needed
}

export interface UpdateSubOrderData {
  status?: string;
  shippingFee?: number;
  discountAmount?: number;
  commissionAmount?: number;
  realAmount?: number;
  totalAmount?: number;
}

class SubOrderRepository {
  async create(tx: any, data: CreateSubOrderData) {
    return (tx as any).subOrder.create({ data });
  }

  async update(tx: any, id: string, data: UpdateSubOrderData) {
    return (tx as any).subOrder.update({
      where: { id },
      data,
    });
  }

  async findById(id: string, shopId?: string) {
    return prisma.subOrder.findFirst({
      where: { id, shopId },
      include: {
        orderItems: true,
        masterOrder: {
          include: { payments: true },
        },
        paymentAllocations: {
          include: { payment: true },
        },
        refunds: true,
        shop: { select: { id: true, name: true, logoUrl: true } },
      },
    });
  }

  async findMany(filters: {
    shopId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const { shopId, status, skip, take } = filters;
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (status) where.status = status;

    return prisma.subOrder.findMany({
      where,
      include: {
        orderItems: true,
        masterOrder: {
          select: {
            receiverName: true,
            receiverPhone: true,
            shippingAddress: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  async count(filters: { shopId?: string; status?: string }) {
    const { shopId, status } = filters;
    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (status) where.status = status;

    return prisma.subOrder.count({ where });
  }
}

export default new SubOrderRepository();
