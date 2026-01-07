import prisma from "../config/database";
import { RoleStatus } from "../constants";

class UserRoleRepository {
  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string) {
    // Check if already assigned
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }

  /**
   * Get all roles of a user (only active roles)
   */
  async getUserRoles(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        role: {
          status: RoleStatus.ACTIVE, // Chỉ lấy roles có status ACTIVE
        },
      },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur) => ur.role);
  }

  /**
   * Get all roles of a user (including inactive - for admin view)
   */
  async getUserRolesAll(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur) => ur.role);
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          code: roleCode,
          status: RoleStatus.ACTIVE, // Chỉ check roles ACTIVE
        },
      },
    });

    return userRole !== null;
  }

  /**
   * Get all permissions of a user (from all active roles)
   */
  async getUserPermissions(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        role: {
          status: RoleStatus.ACTIVE, // Chỉ lấy permissions từ roles ACTIVE
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Collect all unique permissions
    const permissionMap = new Map<string, any>();

    userRoles.forEach((userRole: any) => {
      userRole.role.rolePermissions.forEach((rp: any) => {
        if (!permissionMap.has(rp.permission.id)) {
          permissionMap.set(rp.permission.id, rp.permission);
        }
      });
    });

    return Array.from(permissionMap.values());
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    permissionCode: string
  ): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          status: RoleStatus.ACTIVE, // Chỉ check permissions từ roles ACTIVE
          rolePermissions: {
            some: {
              permission: {
                code: permissionCode,
              },
            },
          },
        },
      },
    });

    return userRole !== null;
  }

  /**
   * Remove all roles from user
   */
  async removeAllRolesFromUser(userId: string): Promise<void> {
    await prisma.userRole.deleteMany({
      where: { userId },
    });
  }
}

export default new UserRoleRepository();
