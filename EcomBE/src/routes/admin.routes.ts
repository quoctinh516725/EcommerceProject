import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermission,
  requireRole,
} from "../middlewares/permission.middleware";
import { PermissionCode } from "../constants";
import { RoleCode } from "../constants";
import {
  validatePagination,
  validateUUID,
} from "../validators/public.validator";

// Controllers
import roleController from "../controllers/role.controller";
import permissionController from "../controllers/permission.controller";
import userController from "../controllers/user.controller";
import adminController from "../controllers/admin.controller";
import voucherController from "../controllers/voucher.controller"; // Added
import staffProductController from "../controllers/staff/product.controller";
import staffShopController from "../controllers/staff/shop.controller";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// ==================== SYSTEM & AUDIT ROUTES ====================
// These are critical routes, specifically for ADMIN role
const systemRoutes = Router();
systemRoutes.use(requireRole(RoleCode.ADMIN));

systemRoutes.get("/settings", adminController.getSystemSettings);
systemRoutes.put("/settings", adminController.updateSystemSetting);
systemRoutes.delete("/settings/:key", adminController.deleteSystemSetting);
systemRoutes.get(
  "/audit-logs",
  validatePagination,
  adminController.getAuditLogs
);

router.use("/", systemRoutes);

// ==================== PRODUCT ROUTES (Aliased from Staff) ====================
// Admin can perform these actions via PERMISSION_APPROVE_PRODUCT (which Admin has)
const productRoutes = Router();
productRoutes.use(requirePermission(PermissionCode.APPROVE_PRODUCT));

productRoutes.get(
  "/products/pending",
  validatePagination,
  staffProductController.getPendingProducts
);
productRoutes.post(
  "/products/:id/approve",
  validateUUID,
  staffProductController.reviewProductApproval
);
productRoutes.post(
  "/products/:id/ban",
  validateUUID,
  staffProductController.banProduct
);

router.use("/", productRoutes);

// ==================== SHOP ROUTES (Aliased from Staff) ====================
const shopRoutes = Router();

shopRoutes.use(requirePermission(PermissionCode.MANAGE_SHOP_STATUS));
shopRoutes.get(
  "/shops/pending",
  validatePagination,
  staffShopController.getPendingShops
);
shopRoutes.post(
  "/shops/:id/approve",
  validateUUID,
  staffShopController.reviewShopApproval
);
shopRoutes.patch(
  "/shops/:id/status",
  validateUUID,
  staffShopController.updateShopStatus
);

router.use("/", shopRoutes);

// ==================== ROLES ROUTES ====================
// All role management routes require MANAGE_ROLES permission
const roleRoutes = Router();
roleRoutes.use(requirePermission(PermissionCode.MANAGE_ROLES));

roleRoutes.get("/", roleController.getAllRoles);
roleRoutes.get("/:id", roleController.getRoleById);
roleRoutes.post("/", roleController.createRole);
roleRoutes.put("/:id", roleController.updateRole);
roleRoutes.delete("/:id", roleController.deleteRole);
roleRoutes.patch("/:id/activate", roleController.activateRole);
roleRoutes.patch("/:id/deactivate", roleController.deactivateRole);
roleRoutes.get("/:id/permissions", roleController.getRolePermissions);
roleRoutes.post(
  "/:roleCode/permissions/:permissionCode",
  roleController.assignPermissionToRole
);
roleRoutes.delete(
  "/:roleCode/permissions/:permissionCode",
  roleController.removePermissionFromRole
);

router.use("/roles", roleRoutes);



// ==================== PERMISSIONS ROUTES ====================
// All permission management routes require MANAGE_PERMISSIONS permission
const permissionRoutes = Router();
permissionRoutes.use(requirePermission(PermissionCode.MANAGE_PERMISSIONS));

permissionRoutes.get("/", permissionController.getAllPermissions);
permissionRoutes.get("/:id", permissionController.getPermissionById);
permissionRoutes.post("/", permissionController.createPermission);
permissionRoutes.put("/:id", permissionController.updatePermission);
permissionRoutes.delete("/:id", permissionController.deletePermission);

router.use("/permissions", permissionRoutes);

// ==================== USERS ROUTES ====================
// All user management routes require VIEW_USER or MANAGE_USER_STATUS permission
const userRoutes = Router();
userRoutes.use(requirePermission(PermissionCode.VIEW_USER));

userRoutes.get("/", userController.getUsers);
userRoutes.get("/:id", userController.getUserById);

// Status management requires MANAGE_USER_STATUS permission
userRoutes.patch(
  "/:id/status",
  requirePermission(PermissionCode.MANAGE_USER_STATUS),
  userController.updateUserStatus
);
userRoutes.delete(
  "/:id",
  requirePermission(PermissionCode.MANAGE_USER_STATUS),
  userController.deleteUser
);
// User role assignment routes (require MANAGE_ROLES permission)
userRoutes.post(
  "/:userId/roles/:roleCode",
  requirePermission(PermissionCode.MANAGE_ROLES),
  roleController.assignRoleToUser
);
userRoutes.delete(
  "/:userId/roles/:roleCode",
  requirePermission(PermissionCode.MANAGE_ROLES),
  roleController.removeRoleFromUser
);
userRoutes.get(
  "/:userId/roles",
  requirePermission(PermissionCode.MANAGE_ROLES),
  roleController.getUserRoles
);

router.use("/users", userRoutes);

// ==================== VOUCHER ROUTES ====================
// Platform voucher management requires ADMIN role
const voucherRoutes = Router();
voucherRoutes.use(requireRole(RoleCode.ADMIN));

voucherRoutes.post("/", voucherController.createPlatformVoucher);
voucherRoutes.get("/", voucherController.getPlatformVouchers);

router.use("/vouchers", voucherRoutes);

export default router;
