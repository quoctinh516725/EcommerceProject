import userRepository from "../repositories/user.repository";
import userRoleRepository from "../repositories/userRole.repository";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../errors/AppError";
import { UserStatus } from "../constants";
import prisma from "../config/database";
import { deleteUserCache } from "../utils/userCache";

export interface UpdateUserProfileInput {
  fullName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
}

export interface UpdateUserStatusInput {
  status: UserStatus;
}

export interface GetUsersQuery {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

class UserService {
  /**
   * Get current user profile
   */
  async getCurrentUserProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get user roles
    const roles = await userRoleRepository.getUserRoles(userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      status: user.status,
      roles: roles.map((role: any) => ({
        id: role.id,
        code: role.code,
        name: role.name,
      })),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update current user profile
   */
  async updateCurrentUserProfile(
    userId: string,
    input: UpdateUserProfileInput
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Validate phone if provided
    if (input.phone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(input.phone)) {
        throw new ValidationError("Invalid phone format");
      }

      // Check if phone is already used by another user
      const existingUser = await userRepository.findByEmail(input.phone);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("Phone number already exists");
      }
    }

    return userRepository.update(userId, {
      fullName: input.fullName,
      phone: input.phone,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
    });
  }

  /**
   * Update user avatar
   */
  async updateUserAvatar(userId: string, avatarUrl: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return userRepository.update(userId, {
      avatarUrl,
    });
  }

  /**
   * Get user by ID (for admin)
   */
  async getUserById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get user roles
    const roles = await userRoleRepository.getUserRolesAll(userId);

    return {
      ...user,
      roles: roles.map((role: any) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        status: role.status,
      })),
    };
  }

  /**
   * Get all users (for admin) with pagination and filters
   */
  async getUsers(query: GetUsersQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { username: { contains: query.search, mode: "insensitive" } },
        { fullName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          fullName: true,
          avatarUrl: true,
          gender: true,
          dateOfBirth: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user status (for admin)
   */
  async updateUserStatus(userId: string, input: UpdateUserStatusInput) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await userRepository.update(userId, {
      status: input.status,
    });

    // Delete user cache to force re-authentication and check new status
    await deleteUserCache(userId);

    return updatedUser;
  }

  /**
   * Delete user (soft delete - set to INACTIVE)
   */
  async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await userRepository.update(userId, {
      status: UserStatus.INACTIVE,
    });

    // Delete user cache to force re-authentication
    await deleteUserCache(userId);

    return updatedUser;
  }
}

export default new UserService();
