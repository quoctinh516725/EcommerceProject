import roleRepository from '../repositories/role.repository';
import userRoleRepository from '../repositories/userRole.repository';
import rolePermissionRepository from '../repositories/rolePermission.repository';
import { ConflictError, NotFoundError } from '../errors/AppError';
import { RoleStatus, RoleCode } from '../constants';
import { deleteUserCache } from '../utils/userCache';

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
  status?: RoleStatus;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  status?: RoleStatus;
}

class RoleService {
  /**
   * Create new role
   */
  async createRole(input: CreateRoleInput) {
    // Check if code already exists
    const codeExists = await roleRepository.codeExists(input.code);
    if (codeExists) {
      throw new ConflictError(`Role with code ${input.code} already exists`);
    }

    return roleRepository.create({
      code: input.code,
      name: input.name,
      description: input.description,
      status: input.status || RoleStatus.ACTIVE,
    });
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, input: UpdateRoleInput) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return roleRepository.update(roleId, input);
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  /**
   * Get role by code
   */
  async getRoleByCode(code: string) {
    const role = await roleRepository.findByCode(code);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  /**
   * Get all roles
   */
  async getAllRoles(status?: RoleStatus) {
    return roleRepository.findAll(status);
  }

  /**
   * Get active roles only
   */
  async getActiveRoles() {
    return roleRepository.findActiveRoles();
  }

  /**
   * Deactivate role (set status to INACTIVE)
   */
  async deactivateRole(roleId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return roleRepository.update(roleId, { status: RoleStatus.INACTIVE });
  }

  /**
   * Activate role (set status to ACTIVE)
   */
  async activateRole(roleId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return roleRepository.update(roleId, { status: RoleStatus.ACTIVE });
  }

  /**
   * Delete role (soft delete - set to INACTIVE)
   */
  async deleteRole(roleId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Prevent deleting system roles
    const systemRoles = [
      RoleCode.ADMIN,
      RoleCode.USER,
      RoleCode.SELLER,
      RoleCode.STAFF,
      RoleCode.GUEST,
    ];

    if (systemRoles.includes(role.code as RoleCode)) {
      throw new ConflictError('Cannot delete system role');
    }

    return roleRepository.delete(roleId);
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleCode: string) {
    const role = await roleRepository.findByCode(roleCode);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.status !== RoleStatus.ACTIVE) {
      throw new ConflictError('Cannot assign inactive role to user');
    }

    await userRoleRepository.assignRoleToUser(userId, role.id);

    // Delete user cache to force refresh with new roles
    await deleteUserCache(userId);

    return { success: true };
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleCode: string) {
    const role = await roleRepository.findByCode(roleCode);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    await userRoleRepository.removeRoleFromUser(userId, role.id);

    // Delete user cache to force refresh with updated roles
    await deleteUserCache(userId);

    return { success: true };
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string) {
    return userRoleRepository.getUserRoles(userId);
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return rolePermissionRepository.getRolePermissions(roleId);
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleCode: string, permissionCode: string) {
    const role = await roleRepository.findByCode(roleCode);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const permission = await permissionRepository.findByCode(permissionCode);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return rolePermissionRepository.assignPermissionToRole(role.id, permission.id);
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleCode: string, permissionCode: string) {
    const role = await roleRepository.findByCode(roleCode);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const permission = await permissionRepository.findByCode(permissionCode);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return rolePermissionRepository.removePermissionFromRole(role.id, permission.id);
  }
}

// Import permissionRepository để dùng trong service
import permissionRepository from '../repositories/permission.repository';

export default new RoleService();



