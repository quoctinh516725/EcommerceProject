import prisma from "../config/database";

export interface CreateNotificationData {
  userId: string;
  title: string;
  content: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
}

export class NotificationRepository {
  async create(data: CreateNotificationData) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        type: data.type,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        isRead: false,
      },
    });
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
    isRead?: boolean
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
