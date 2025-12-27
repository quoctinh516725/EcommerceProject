import prisma from '../config/database';
import { User } from '@prisma/client';
import { UserStatus } from '../constants';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: Date;
  status?: UserStatus;
  lastLoginAt?: Date;
}

class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        phone: data.phone,
        fullName: data.fullName,
        status: UserStatus.ACTIVE,
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return user !== null;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return user !== null;
  }
}

export default new UserRepository();

