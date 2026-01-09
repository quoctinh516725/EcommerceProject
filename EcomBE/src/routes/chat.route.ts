import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
const chatController = new ChatController();

router.use(authenticate);

router.post("/conversations", chatController.startConversation);
router.get("/conversations", chatController.getConversations);
router.get("/conversations/:id/messages", chatController.getMessages);
router.post("/messages", chatController.sendMessage);
router.patch("/conversations/:id/read", chatController.markAsRead);

export default router;
