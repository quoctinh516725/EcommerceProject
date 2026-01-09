import prisma from "../config/database";

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE";
}

export class ChatRepository {
  async findConversation(userId: string, shopId: string) {
    return prisma.conversation.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });
  }

  async createConversation(userId: string, shopId: string) {
    return prisma.conversation.create({
      data: {
        userId,
        shopId,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });
  }

  // Assuming shopId is passed, not sellerId directly, service will resolve seller -> shop
  async getShopConversations(shopId: string) {
    return prisma.conversation.findMany({
      where: { shopId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });
  }

  async createMessage(data: CreateMessageData) {
    return prisma.$transaction(async (tx) => {
      // Create message
      const message = await (tx as any).message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          messageType: data.messageType,
          isRead: false,
        },
      });
      await (tx as any).conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessage:
            data.messageType === "IMAGE" ? "Image sent" : data.content,
          lastMessageAt: new Date(),
        },
      });

      return message;
    });
  }

  async updateUnreadCount(
    conversationId: string,
    incrementFor: "USER" | "SHOP"
  ) {
    const data =
      incrementFor === "USER"
        ? { unreadCountUser: { increment: 1 } }
        : { unreadCountShop: { increment: 1 } };

    return prisma.conversation.update({
      where: { id: conversationId },
      data,
    });
  }

  async resetUnreadCount(conversationId: string, role: "USER" | "SHOP") {
    const data =
      role === "USER" ? { unreadCountUser: 0 } : { unreadCountShop: 0 };

    return prisma.conversation.update({
      where: { id: conversationId },
      data,
    });
  }

  async getMessages(conversationId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: "desc" }, // Latest first
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      messages: messages.reverse(), // Return chronological order
      total,
      page,
      limit,
    };
  }

  async getConversationById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        shop: true, // Need checks
      },
    });
  }
}
