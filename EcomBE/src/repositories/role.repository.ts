import prisma from '../config/database';
import { Role } from '@prisma/client';
import { RoleStatus } from '../constants';

export interface CreateRoleData {
  code: string;
  name: string;
  description?: string;
  status?: RoleStatus;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  status?: RoleStatus;
}

class RoleRepository {
  /**
   * Find role by code
   */
  async findByCode(code: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { code },
    });
  }

  /**
   * Find role by ID
   */
  async findById(id: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Find all roles (with optional status filter)
   */
  async findAll(status?: RoleStatus): Promise<Role[]> {
    const where = status ? { status } : {};
    return prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find active roles only
   */
  async findActiveRoles(): Promise<Role[]> {
    return prisma.role.findMany({
      where: { status: RoleStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create new role
   */
  async create(data: CreateRoleData): Promise<Role> {
    return prisma.role.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        status: data.status || RoleStatus.ACTIVE,
      },
    });
  }

  /**
   * Update role
   */
  async update(id: string, data: UpdateRoleData): Promise<Role> {
    return prisma.role.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete role (soft delete by setting status to INACTIVE)
   */
  async delete(id: string): Promise<Role> {
    return prisma.role.update({
      where: { id },
      data: { status: RoleStatus.INACTIVE },
    });
  }

  /**
   * Check if role code exists
   */
  async codeExists(code: string): Promise<boolean> {
    const role = await prisma.role.findUnique({
      where: { code },
      select: { id: true },
    });
    return role !== null;
  }
}

export default new RoleRepository();



