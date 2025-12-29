import prisma from '../config/database';

class RolePermissionRepository {
  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: string, permissionId: string) {
    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Get all permissions of a role
   */
  async getRolePermissions(roleId: string) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * Check if role has a specific permission
   */
  async hasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId,
        permission: {
          code: permissionCode,
        },
      },
    });

    return rolePermission !== null;
  }

  /**
   * Remove all permissions from role
   */
  async removeAllPermissionsFromRole(roleId: string): Promise<void> {
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });
  }
}

export default new RolePermissionRepository();

