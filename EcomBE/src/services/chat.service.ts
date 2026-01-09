import { ChatRepository } from "../repositories/chat.repository";
import { socketService } from "../socket";
import prisma from "../config/database";
import { AppError } from "../errors/AppError";
import shopRepository from "../repositories/shop.repository";

const chatRepository = new ChatRepository();

export class ChatService {
  async startConversation(userId: string, shopId: string) {
    let conversation = await chatRepository.findConversation(userId, shopId);
    if (!conversation) {
      conversation = await chatRepository.createConversation(userId, shopId);
      // Notify shop owner if online is not strictly required here as it's just empty convo,
      // but we could join rooms if we had dynamic room logic.
    }
    return conversation;
  }

  async sendMessage(
    senderId: string,
    data: {
      conversationId: string;
      content: string;
      messageType: "TEXT" | "IMAGE";
    }
  ) {
    const conversation = await chatRepository.getConversationById(
      data.conversationId
    );
    if (!conversation) throw new AppError("Conversation not found", 404);

    // Verify sender is participant
    const isUser = conversation.userId === senderId;

    // Find shop to check seller
    const shop = await prisma.shop.findUnique({
      where: { id: conversation.shopId },
    });
    if (!shop) throw new AppError("Shop not found", 404); // Should not happen

    const isSeller = shop.sellerId === senderId;

    if (!isUser && !isSeller) {
      throw new AppError("You are not part of this conversation", 403);
    }

    // Create message
    const message = await chatRepository.createMessage({
      conversationId: data.conversationId,
      senderId,
      content: data.content,
      messageType: data.messageType,
    });

    // Update unread count for the recipient
    if (isUser) {
      await chatRepository.updateUnreadCount(conversation.id, "SHOP");
      // Emit to shop owner
      socketService.emitToUser(shop.sellerId, "receive_message", message);
    } else {
      await chatRepository.updateUnreadCount(conversation.id, "USER");
      // Emit to user
      socketService.emitToUser(conversation.userId, "receive_message", message);
    }

    return message;
  }

  async getUserConversations(userId: string) {
    return chatRepository.getUserConversations(userId);
  }

  async getShopConversations(userId: string) {
    // Find shop of this user
    const shop = await shopRepository.findBySellerId(userId);
    if (!shop) throw new AppError("You do not have a shop", 400);

    return chatRepository.getShopConversations(shop.id);
  }

  async getMessages(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const conversation =
      await chatRepository.getConversationById(conversationId);
    if (!conversation) throw new AppError("Conversation not found", 404);

    const shop = await shopRepository.findById(conversation.shopId);

    // Check permission
    if (conversation.userId !== userId && shop?.sellerId !== userId) {
      throw new AppError(
        "You do not have permission to view this conversation",
        403
      );
    }

    return chatRepository.getMessages(conversationId, page, limit);
  }

  async markConversationAsRead(userId: string, conversationId: string) {
    const conversation =
      await chatRepository.getConversationById(conversationId);
    if (!conversation) throw new AppError("Conversation not found", 404);

    const shop = await shopRepository.findById(conversation.shopId);

    if (conversation.userId === userId) {
      await chatRepository.resetUnreadCount(conversationId, "USER");
    } else if (shop?.sellerId === userId) {
      await chatRepository.resetUnreadCount(conversationId, "SHOP");
    } else {
      throw new AppError("You do not have permission to access this", 403);
    }

    return { success: true };
  }
}
