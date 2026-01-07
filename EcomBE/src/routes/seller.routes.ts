import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/permission.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import {
  requireShop,
  requireProductOwnership,
} from "../middlewares/ownership.middleware";
import { PermissionCode } from "../constants";
import { RoleCode } from "../constants";
import { validatePagination } from "../validators/public.validator";
import shopController from "../controllers/seller/shop.controller";
import productController from "../controllers/seller/product.controller";
import refundController from "../controllers/refund.controller";
import voucherController from "../controllers/voucher.controller";

const router = Router();

// All seller routes require authentication
router.use(authenticate);

// All seller routes require SELLER role
router.use(requireRole(RoleCode.SELLER));

// ==================== SHOP ROUTES ====================
router.get("/shop", shopController.getMyShop);
router.post(
  "/shop",
  requirePermission(PermissionCode.CREATE_SHOP),
  shopController.createShop
);
router.put(
  "/shop",
  requirePermission(PermissionCode.UPDATE_SHOP),
  requireShop,
  shopController.updateShop
);
router.patch(
  "/shop/status",
  requirePermission(PermissionCode.UPDATE_SHOP),
  requireShop,
  shopController.updateShopStatus
);

// ==================== PRODUCT ROUTES ====================
router.get(
  "/products",
  validatePagination,
  requirePermission(PermissionCode.VIEW_PRODUCT),
  requireShop,
  productController.getMyProducts
);
router.get(
  "/products/:id",
  requirePermission(PermissionCode.VIEW_PRODUCT),
  requireProductOwnership,
  productController.getMyProduct
);
router.post(
  "/products",
  requirePermission(PermissionCode.CREATE_PRODUCT),
  requireShop,
  productController.createProduct
);
router.put(
  "/products/:id",
  requirePermission(PermissionCode.UPDATE_PRODUCT),
  requireProductOwnership,
  productController.updateProduct
);
router.delete(
  "/products/:id",
  requirePermission(PermissionCode.DELETE_PRODUCT),
  requireProductOwnership,
  productController.deleteProduct
);
router.patch(
  "/products/:id/status",
  requirePermission(PermissionCode.UPDATE_PRODUCT),
  requireProductOwnership,
  productController.updateProductStatus
);

// ==================== REFUND/CANCEL ROUTES ====================
router.patch(
  "/refunds/:refundId",
  requirePermission(PermissionCode.UPDATE_ORDER),
  requireShop,
  refundController.handleRefundRequest
);

// ==================== VOUCHER ROUTES ====================
router.post(
  "/vouchers",
  requirePermission(PermissionCode.CREATE_PRODUCT),
  requireShop,
  voucherController.createShopVoucher
);
router.get(
  "/vouchers",
  requirePermission(PermissionCode.VIEW_PRODUCT),
  requireShop,
  voucherController.getShopVouchers
);

export default router;
