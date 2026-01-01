import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permission.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { RoleCode } from '../constants';
import * as PermissionCodes from '../constants/permission-codes';
import { validatePagination } from '../validators/public.validator';
import { validateUUID } from '../validators/public.validator';

// Controllers
import productController from '../controllers/staff/product.controller';
import shopController from '../controllers/staff/shop.controller';
import userController from '../controllers/staff/user.controller';

const router = Router();

// All staff routes require authentication and STAFF role
router.use(authenticate);
router.use(requireRole(RoleCode.STAFF));

// ==================== PRODUCT ROUTES ====================
// GET pending products
router.get(
  '/products/pending',
  validatePagination,
  requirePermission(PermissionCodes.PERMISSION_APPROVE_PRODUCT),
  productController.getPendingProducts
);

// GET all products (with status filter)
router.get(
  '/products',
  validatePagination,
  requirePermission(PermissionCodes.PERMISSION_APPROVE_PRODUCT),
  productController.getAllProducts
);

// GET product by ID
router.get(
  '/products/:id',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_APPROVE_PRODUCT),
  productController.getProductById
);

// POST review product approval (approve or reject)
router.post(
  '/products/:id/approve',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_APPROVE_PRODUCT),
  productController.reviewProductApproval
);

// POST ban product
router.post(
  '/products/:id/ban',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_APPROVE_PRODUCT),
  productController.banProduct
);

// ==================== SHOP ROUTES ====================
// GET pending shops
router.get(
  '/shops/pending',
  validatePagination,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_SHOP_STATUS),
  shopController.getPendingShops
);

// GET all shops (with status filter)
router.get(
  '/shops',
  validatePagination,
  requirePermission(PermissionCodes.PERMISSION_VIEW_SHOP),
  shopController.getAllShops
);

// GET shop by ID
router.get(
  '/shops/:id',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_VIEW_SHOP),
  shopController.getShopById
);

// POST review shop approval (approve or reject)
router.post(
  '/shops/:id/approve',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_SHOP_STATUS),
  shopController.reviewShopApproval
);

// POST suspend shop
router.post(
  '/shops/:id/suspend',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_SHOP_STATUS),
  shopController.bannedShop
);

// POST activate shop
router.post(
  '/shops/:id/activate',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_SHOP_STATUS),
  shopController.activateShop
);

// PATCH update shop status
router.patch(
  '/shops/:id/status',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_SHOP_STATUS),
  shopController.updateShopStatus
);

// ==================== USER ROUTES ====================
// GET all users (with status filter)
router.get(
  '/users',
  validatePagination,
  requirePermission(PermissionCodes.PERMISSION_VIEW_USER),
  userController.getAllUsers
);

// GET user by ID
router.get(
  '/users/:id',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_VIEW_USER),
  userController.getUserById
);

// POST lock user
router.post(
  '/users/:id/lock',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_USER_STATUS),
  userController.lockUser
);

// POST unlock user
router.post(
  '/users/:id/unlock',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_USER_STATUS),
  userController.unlockUser
);

// PATCH update user status
router.patch(
  '/users/:id/status',
  validateUUID,
  requirePermission(PermissionCodes.PERMISSION_MANAGE_USER_STATUS),
  userController.updateUserStatus
);

export default router;

