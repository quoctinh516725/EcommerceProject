import prisma from '../config/database';
import { RefreshToken } from '@prisma/client';

export interface CreateRefreshTokenData {
  userId: string;
  token: string;
  expiredAt: Date;
}

class RefreshTokenRepository {
  /**
   * Create new refresh token
   */
  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Find refresh token by token string
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Revoke refresh token
   */
  async revoke(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiredAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

export default new RefreshTokenRepository();

