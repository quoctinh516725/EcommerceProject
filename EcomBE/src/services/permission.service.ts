import permissionRepository from '../repositories/permission.repository';
import { ConflictError, NotFoundError } from '../errors/AppError';

export interface CreatePermissionInput {
  code: string;
  description?: string;
}

export interface UpdatePermissionInput {
  description?: string;
}

class PermissionService {
  /**
   * Create new permission
   */
  async createPermission(input: CreatePermissionInput) {
    // Check if code already exists
    const codeExists = await permissionRepository.codeExists(input.code);
    if (codeExists) {
      throw new ConflictError(`Permission with code ${input.code} already exists`);
    }

    return permissionRepository.create({
      code: input.code,
      description: input.description,
    });
  }

  /**
   * Update permission
   */
  async updatePermission(permissionId: string, input: UpdatePermissionInput) {
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return permissionRepository.update(permissionId, input);
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(permissionId: string) {
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }
    return permission;
  }

  /**
   * Get permission by code
   */
  async getPermissionByCode(code: string) {
    const permission = await permissionRepository.findByCode(code);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }
    return permission;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return permissionRepository.findAll();
  }

  /**
   * Delete permission
   */
  async deletePermission(permissionId: string) {
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    await permissionRepository.delete(permissionId);
  }
}

export default new PermissionService();



