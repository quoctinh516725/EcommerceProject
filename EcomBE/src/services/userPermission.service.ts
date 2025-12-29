import userRoleRepository from '../repositories/userRole.repository';
import { NotFoundError } from '../errors/AppError';
import userRepository from '../repositories/user.repository';

class UserPermissionService {
  /**
   * Get all permissions of a user (from all active roles)
   */
  async getUserPermissions(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return userRoleRepository.getUserPermissions(userId);
  }

  /**
   * Get all roles of a user (only active roles)
   */
  async getUserRoles(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return userRoleRepository.getUserRoles(userId);
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }

    return userRoleRepository.hasPermission(userId, permissionCode);
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }

    return userRoleRepository.hasRole(userId, roleCode);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    for (const code of permissionCodes) {
      if (await this.hasPermission(userId, code)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    for (const code of permissionCodes) {
      if (!(await this.hasPermission(userId, code))) {
        return false;
      }
    }
    return true;
  }
}

export default new UserPermissionService();



