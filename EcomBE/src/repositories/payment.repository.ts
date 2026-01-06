import prisma from "../config/database";

class PaymentRepository {
  async create(tx: any, data: any) {
    return (tx as any).payment.create({ data });
  }

  async update(tx: any, id: string, data: any) {
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

  async createAllocation(tx: any, data: any) {
    return (tx as any).paymentAllocation.create({ data });
  }
}

export default new PaymentRepository();
