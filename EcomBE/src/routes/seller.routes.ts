import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permission.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { requireShop, requireProductOwnership } from '../middlewares/ownership.middleware';
import * as PermissionCodes from '../constants/permission-codes';
import { RoleCode } from '../constants';
import { validatePagination } from '../validators/public.validator';
import shopController from '../controllers/seller/shop.controller';
import productController from '../controllers/seller/product.controller';

const router = Router();

// All seller routes require authentication
router.use(authenticate);

// All seller routes require SELLER role
router.use(requireRole(RoleCode.SELLER));

// ==================== SHOP ROUTES ====================
router.get('/shop', shopController.getMyShop);
router.post('/shop', requirePermission(PermissionCodes.PERMISSION_CREATE_SHOP), shopController.createShop);
router.put('/shop', requirePermission(PermissionCodes.PERMISSION_UPDATE_SHOP), requireShop, shopController.updateShop);
router.patch('/shop/status', requirePermission(PermissionCodes.PERMISSION_UPDATE_SHOP), requireShop, shopController.updateShopStatus);

// ==================== PRODUCT ROUTES ====================
router.get('/products', validatePagination, requirePermission(PermissionCodes.PERMISSION_VIEW_PRODUCT), requireShop, productController.getMyProducts);
router.get('/products/:id', requirePermission(PermissionCodes.PERMISSION_VIEW_PRODUCT), requireProductOwnership, productController.getMyProduct);
router.post('/products', requirePermission(PermissionCodes.PERMISSION_CREATE_PRODUCT), requireShop, productController.createProduct);
router.put('/products/:id', requirePermission(PermissionCodes.PERMISSION_UPDATE_PRODUCT), requireProductOwnership, productController.updateProduct);
router.delete('/products/:id', requirePermission(PermissionCodes.PERMISSION_DELETE_PRODUCT), requireProductOwnership, productController.deleteProduct);
router.patch('/products/:id/status', requirePermission(PermissionCodes.PERMISSION_UPDATE_PRODUCT), requireProductOwnership, productController.updateProductStatus);

export default router;

