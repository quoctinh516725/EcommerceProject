import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import cartService, { CartIdentifier } from "../services/cart.service";
import { sendSuccess } from "../utils/response";
import { ValidationError } from "../errors/AppError";

class CartController {
  private getCartIdentifier(req: Request, res: Response): CartIdentifier {
    // 1. Check if user is authenticated
    if (req.user?.userId) {
      return { type: "user", id: req.user.userId };
    }

    // 2. Check if guestId exists in cookies
    let guestId = req.cookies?.guestId;

    // 3. If no guestId, generate and set cookie
    if (!guestId) {
      guestId = crypto.randomUUID();
      res.cookie("guestId", guestId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return { type: "guest", id: guestId };
  }

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = this.getCartIdentifier(req, res);
      const cart = await cartService.getCart(identifier);
      sendSuccess(res, cart, "Cart retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = this.getCartIdentifier(req, res);
      const { productVariantId, quantity } = req.body;

      if (!productVariantId || !quantity)
        throw new ValidationError("Missing required fields");
      if (quantity <= 0) throw new ValidationError("Quantity must be positive");

      await cartService.addToCart(identifier, productVariantId, quantity);
      sendSuccess(res, null, "Item added to cart");
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = this.getCartIdentifier(req, res);
      const { id } = req.params; // productVariantId
      const { quantity } = req.body;

      if (quantity === undefined)
        throw new ValidationError("Quantity is required");

      await cartService.updateQuantity(identifier, id, quantity);
      sendSuccess(res, null, "Cart updated");
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = this.getCartIdentifier(req, res);
      const { id } = req.params; // productVariantId

      await cartService.removeItem(identifier, id);
      sendSuccess(res, null, "Item removed from cart");
    } catch (error) {
      next(error);
    }
  };
}

export default new CartController();
