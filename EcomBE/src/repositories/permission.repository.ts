import prisma from '../config/database';
import { Permission } from '@prisma/client';

export interface CreatePermissionData {
  code: string;
  description?: string;
}

export interface UpdatePermissionData {
  description?: string;
}

class PermissionRepository {
  /**
   * Find permission by code
   */
  async findByCode(code: string): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { code },
    });
  }

  /**
   * Find permission by ID
   */
  async findById(id: string): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find all permissions
   */
  async findAll(): Promise<Permission[]> {
    return prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create new permission
   */
  async create(data: CreatePermissionData): Promise<Permission> {
    return prisma.permission.create({
      data: {
        code: data.code,
        description: data.description,
      },
    });
  }

  /**
   * Update permission
   */
  async update(id: string, data: UpdatePermissionData): Promise<Permission> {
    return prisma.permission.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete permission
   */
  async delete(id: string): Promise<void> {
    await prisma.permission.delete({
      where: { id },
    });
  }

  /**
   * Check if permission code exists
   */
  async codeExists(code: string): Promise<boolean> {
    const permission = await prisma.permission.findUnique({
      where: { code },
      select: { id: true },
    });
    return permission !== null;
  }
}

export default new PermissionRepository();



