import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { sendSuccess } from "../utils/response";

const notificationService = new NotificationService();

export class NotificationController {
  getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const { page, limit, isRead } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        page: Number(page),
        limit: Number(limit),
        isRead:
          isRead === "true" ? true : isRead === "false" ? false : undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.getUnreadCount(userId);
      sendSuccess(res, { count });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await notificationService.markAsRead(userId, id);
      sendSuccess(res, result, "Marked as read");
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.markAllAsRead(userId);
      sendSuccess(res, result, "Marked all as read");
    } catch (error) {
      next(error);
    }
  };
}
