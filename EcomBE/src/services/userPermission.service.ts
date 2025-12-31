import rolePermissionRepository from '../repositories/rolePermission.repository';
import userRoleRepository from '../repositories/userRole.repository';
import { NotFoundError } from '../errors/AppError';
import userRepository from '../repositories/user.repository';

class UserPermissionService {
  /**
   * Get all permissions of a user (from all active roles)
   * Note: This method still uses userId for backward compatibility with admin/user management features
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
   * Note: This method still uses userId for backward compatibility with admin/user management features
   */
  async getUserRoles(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return userRoleRepository.getUserRoles(userId);
  }

 
  async hasPermission(roleCodes: string[], permissionCode: string): Promise<boolean> {
    return rolePermissionRepository.hasPermissionByRoleCodes(roleCodes, permissionCode);
  }

  /**
   * Check if user has a specific role
   * Note: This method still uses userId for backward compatibility with admin/user management features
   */
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }

    return userRoleRepository.hasRole(userId, roleCode);
  }


  async hasAnyPermission(roleCodes: string[], permissionCodes: string[]): Promise<boolean> {
    for (const code of permissionCodes) {
      if (await this.hasPermission(roleCodes, code)) {
        return true;
      }
    }
    return false;
  }


  async hasAllPermissions(roleCodes: string[], permissionCodes: string[]): Promise<boolean> {
    for (const code of permissionCodes) {
      if (!(await this.hasPermission(roleCodes, code))) {
        return false;
      }
    }
    return true;
  }
}

export default new UserPermissionService();



