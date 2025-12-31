import bcrypt from 'bcrypt';
import { UserStatus, RoleCode } from '../constants';
import userRepository from '../repositories/user.repository';
import refreshTokenRepository from '../repositories/refreshToken.repository';
import roleRepository from '../repositories/role.repository';
import userRoleRepository from '../repositories/userRole.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenRemainingTime,
  decodeToken,
} from '../utils/jwt';
import { addToBlacklist } from '../utils/blacklist';
import { saveUserCache, deleteUserCache } from '../utils/userCache';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../errors/AppError';
import shopRepository from '../repositories/shop.repository';
import { env } from '../config/env';

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  phone?: string;
  fullName?: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    status: string;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Register new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const emailExists = await userRepository.emailExists(input.email);
    if (emailExists) {
      throw new ConflictError('Email already exists');
    }

    // Check if username already exists
    const usernameExists = await userRepository.usernameExists(input.username);
    if (usernameExists) {
      throw new ConflictError('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await userRepository.create({
      email: input.email,
      username: input.username,
      password: hashedPassword,
      phone: input.phone,
      fullName: input.fullName,
    });

    let roleCodes =[RoleCode.USER];

    // Assign default USER role
    try {
      const userRole = await roleRepository.findByCode(RoleCode.USER);
      if (userRole) {
        await userRoleRepository.assignRoleToUser(user.id, userRole.id);
      }
    } catch (error) {
      // Ignore if role not found (will be assigned later via seed)
      roleCodes =[]
      console.warn('Could not assign USER role to new user:', error);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: roleCodes,
    });

    const refreshTokenString = generateRefreshToken(user.id);

    // Calculate refresh token expiration (7 days from now)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + parseInt(env.JWT_REFRESH_EXPIRES_IN || '7'));

    // Save refresh token to database
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshTokenString,
      expiredAt: refreshTokenExpiry,
    });

    // Save user cache to Redis
    const accessTokenTTL = getTokenRemainingTime(accessToken);
    await saveUserCache(
      user.id,
      {
        userId: user.id,
        status: user.status as any,
        roles: roleCodes,
      },
      accessTokenTTL
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        status: user.status,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email or username
    const user = await userRepository.findByEmailOrUsername(input.emailOrUsername);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Revoke all existing refresh tokens (optional - for security)
    await refreshTokenRepository.revokeAllByUserId(user.id);

    // Get user roles for token
    const userRoles = await userRoleRepository.getUserRoles(user.id);
    const roleCodes = userRoles.map((role: any) => role.code);

    // Get shop info if user is a seller (cache to avoid DB queries)
    let shopId: string | undefined;
    if (roleCodes.includes(RoleCode.SELLER)) {
      const shop = await shopRepository.findBySellerId(user.id);
      shopId = shop?.id;
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: roleCodes,
      shopId,
    });

    const refreshTokenString = generateRefreshToken(user.id);

    // Calculate refresh token expiration (7 days from now)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + parseInt(env.JWT_REFRESH_EXPIRES_IN!));

    // Save refresh token to database
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshTokenString,
      expiredAt: refreshTokenExpiry,
    });

    // Save user cache to Redis
    const accessTokenTTL = getTokenRemainingTime(accessToken);
    await saveUserCache(
      user.id,
      {
        userId: user.id,
        status: user.status as any,
        roles: roleCodes,
      },
      accessTokenTTL
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        status: user.status,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenString: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    try {
      verifyRefreshToken(refreshTokenString);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Find refresh token in database
    const refreshToken = await refreshTokenRepository.findByToken(refreshTokenString);
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    // Check if token is revoked
    if (refreshToken.revoked) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // Check if token is expired
    if (refreshToken.expiredAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Get user
    const user = await userRepository.findById(refreshToken.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Get user roles for token
    const userRoles = await userRoleRepository.getUserRoles(user.id);
    const roleCodes = userRoles.map((role: any) => role.code);

    // Get shop info if user is a seller (cache to avoid DB queries)
    let shopId: string | undefined;
    if (roleCodes.includes(RoleCode.SELLER)) {
      const shop = await shopRepository.findBySellerId(user.id);
      shopId = shop?.id;
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: roleCodes,
      shopId,
    });

    // Update user cache in Redis with new token TTL (include shopId)
    const accessTokenTTL = getTokenRemainingTime(accessToken);
    await saveUserCache(
      user.id,
      {
        userId: user.id,
        status: user.status as any,
        roles: roleCodes,
        shopId,
      },
      accessTokenTTL
    );

    return { accessToken };
  }

  /**
   * Logout user (revoke refresh token and blacklist access token)
   */
  async logout(refreshTokenString: string, accessToken?: string): Promise<void> {
    // Revoke refresh token
    let userId: string | null = null;
    try {
      const refreshToken = await refreshTokenRepository.findByToken(refreshTokenString);
      if (refreshToken && !refreshToken.revoked) {
        userId = refreshToken.userId;
        await refreshTokenRepository.revoke(refreshTokenString);
      }
    } catch (error) {
      // Ignore if token not found
    }

    // Get userId from access token if not available from refresh token
    if (!userId && accessToken) {
      try {
        const decoded = decodeToken(accessToken);
        if (decoded) {
          userId = decoded.userId;
        }
      } catch (error) {
        // Ignore if token invalid
      }
    }

    // Delete user cache from Redis
    if (userId) {
      await deleteUserCache(userId);
    }

    // Blacklist access token if provided
    if (accessToken) {
      const remainingTime = getTokenRemainingTime(accessToken);
      if (remainingTime > 0) {
        await addToBlacklist(accessToken, remainingTime);
      }
    }
  }
}

export default new AuthService();
