import prisma from "../config/database";

export interface CreatePaymentData {
  masterOrderId: string;
  userId: string;
  totalAmount: number | any;
  paymentMethod: string;
  transactionId?: string;
  status?: string;
}

export interface UpdatePaymentData {
  status?: string;
  transactionId?: string;
  totalAmount?: number | any;
  paidAt?: Date;
}

export interface CreatePaymentAllocationData {
  paymentId: string;
  subOrderId: string;
  amount: number | any;
}

class PaymentRepository {
  async create(tx: any, data: CreatePaymentData) {
    return (tx as any).payment.create({ data });
  }

  async update(tx: any, id: string, data: UpdatePaymentData) {
    return (tx as any).payment.update({
      where: { id },
      data,
    });
  }

  async findById(id: string, includeAllocations = false) {
    return prisma.payment.findUnique({
      where: { id },
      include: { allocations: includeAllocations },
    });
  }

  async createAllocation(tx: any, data: CreatePaymentAllocationData) {
    return (tx as any).paymentAllocation.create({ data });
  }
}

export default new PaymentRepository();
