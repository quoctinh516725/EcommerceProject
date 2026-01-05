import { Router } from "express";
import cartController from "../controllers/cart.controller";
import { optionalAuthenticate } from "../middlewares/auth.middleware";

const router = Router();

// Use optionalAuthenticate instead of requireAuth to support Guests
router.use(optionalAuthenticate);

router.get("/", cartController.getCart);
router.post("/items", cartController.addToCart);
router.patch("/items/:id", cartController.updateItem);
router.delete("/items/:id", cartController.removeItem);

export default router;
