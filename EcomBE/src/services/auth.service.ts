import bcrypt from 'bcrypt';
import { UserStatus } from '../constants';
import userRepository from '../repositories/user.repository';
import refreshTokenRepository from '../repositories/refreshToken.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenRemainingTime,
} from '../utils/jwt';
import { addToBlacklist } from '../utils/blacklist';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../errors/AppError';
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

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
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

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshTokenString = generateRefreshToken(user.id);

    // Calculate refresh token expiration (7 days from now)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Save refresh token to database
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshTokenString,
      expiredAt: refreshTokenExpiry,
    });

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
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshTokenString);
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

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return { accessToken };
  }

  /**
   * Logout user (revoke refresh token and blacklist access token)
   */
  async logout(refreshTokenString: string, accessToken?: string): Promise<void> {
    // Revoke refresh token
    try {
      const refreshToken = await refreshTokenRepository.findByToken(refreshTokenString);
      if (refreshToken && !refreshToken.revoked) {
        await refreshTokenRepository.revoke(refreshTokenString);
      }
    } catch (error) {
      // Ignore if token not found

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
