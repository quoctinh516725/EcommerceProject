import prisma from "../config/database";
import { Prisma } from "@prisma/client";

export interface AuditLogData {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: string; // JSON string
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogRepository {
  /**
   * Create new audit log
   */
  async create(data: AuditLogData) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Get all audit logs with filters and pagination
   */
  async getAll(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.resource) where.resource = { contains: filters.resource };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

export default new AuditLogRepository();
