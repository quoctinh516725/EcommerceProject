import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import * as PermissionCodes from '../constants/permission-codes';
import roleController from '../controllers/role.controller';
import permissionController from '../controllers/permission.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// ==================== ROLES ROUTES ====================
// All role management routes require MANAGE_ROLES permission
const roleRoutes = Router();
roleRoutes.use(requirePermission(PermissionCodes.PERMISSION_MANAGE_ROLES));

roleRoutes.get('/', roleController.getAllRoles);
roleRoutes.get('/:id', roleController.getRoleById);
roleRoutes.post('/', roleController.createRole);
roleRoutes.put('/:id', roleController.updateRole);
roleRoutes.delete('/:id', roleController.deleteRole);
roleRoutes.patch('/:id/activate', roleController.activateRole);
roleRoutes.patch('/:id/deactivate', roleController.deactivateRole);
roleRoutes.get('/:id/permissions', roleController.getRolePermissions);
roleRoutes.post('/:roleCode/permissions/:permissionCode', roleController.assignPermissionToRole);
roleRoutes.delete('/:roleCode/permissions/:permissionCode', roleController.removePermissionFromRole);

router.use('/roles', roleRoutes);

// User role assignment routes (require MANAGE_ROLES permission)
router.post('/users/:userId/roles/:roleCode', requirePermission(PermissionCodes.PERMISSION_MANAGE_ROLES), roleController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleCode', requirePermission(PermissionCodes.PERMISSION_MANAGE_ROLES), roleController.removeRoleFromUser);
router.get('/users/:userId/roles', requirePermission(PermissionCodes.PERMISSION_MANAGE_ROLES), roleController.getUserRoles);

// ==================== PERMISSIONS ROUTES ====================
// All permission management routes require MANAGE_PERMISSIONS permission
const permissionRoutes = Router();
permissionRoutes.use(requirePermission(PermissionCodes.PERMISSION_MANAGE_PERMISSIONS));

permissionRoutes.get('/', permissionController.getAllPermissions);
permissionRoutes.get('/:id', permissionController.getPermissionById);
permissionRoutes.post('/', permissionController.createPermission);
permissionRoutes.put('/:id', permissionController.updatePermission);
permissionRoutes.delete('/:id', permissionController.deletePermission);

router.use('/permissions', permissionRoutes);

export default router;

