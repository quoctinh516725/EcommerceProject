import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service";
import { sendSuccess } from "../utils/response";

const chatService = new ChatService();

export class ChatController {
  startConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { shopId } = req.body;
      const result = await chatService.startConversation(userId, shopId);
      sendSuccess(res, result, "Conversation started");
    } catch (error) {
      next(error);
    }
  };

  getConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { role } = req.query; // 'USER' or 'SELLER'

      let result;
      if (role === "SELLER") {
        result = await chatService.getShopConversations(userId);
      } else {
        result = await chatService.getUserConversations(userId);
      }

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { conversationId, content, type } = req.body;
      const result = await chatService.sendMessage(userId, {
        conversationId,
        content,
        messageType: type || "TEXT",
      });
      sendSuccess(res, result, "Message sent");
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await chatService.getMessages(
        userId,
        id,
        Number(page) || 1,
        Number(limit) || 20
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await chatService.markConversationAsRead(userId, id);
      sendSuccess(res, result, "Marked as read");
    } catch (error) {
      next(error);
    }
  };
}
