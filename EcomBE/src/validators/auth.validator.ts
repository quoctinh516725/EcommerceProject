import { ValidationError } from '../errors/AppError';

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

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
  accessToken?: string;
}

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format (alphanumeric, underscore, 3-20 chars)
 */
const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate password strength (min 6 chars)
 */
const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate phone format (optional, Vietnamese format)
 */
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate register input
 */
export const validateRegister = (input: Partial<RegisterInput>): RegisterInput => {
  const errors: string[] = [];

  // Email validation
  if (!input.email || typeof input.email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(input.email)) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!input.password || typeof input.password !== 'string') {
    errors.push('Password is required');
  } else if (!isValidPassword(input.password)) {
    errors.push('Password must be at least 6 characters');
  }

  // Username validation
  if (!input.username || typeof input.username !== 'string') {
    errors.push('Username is required');
  } else if (!isValidUsername(input.username)) {
    errors.push('Username must be 3-20 characters and contain only letters, numbers, and underscores');
  }

  // Phone validation (optional)
  if (input.phone && typeof input.phone === 'string' && !isValidPhone(input.phone)) {
    errors.push('Invalid phone format');
  }

  // Full name validation (optional)
  if (input.fullName && typeof input.fullName !== 'string') {
    errors.push('Full name must be a string');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  return {
    email: input.email!,
    password: input.password!,
    username: input.username!,
    phone: input.phone,
    fullName: input.fullName,
  };
};

/**
 * Validate login input
 */
export const validateLogin = (input: Partial<LoginInput>): LoginInput => {
  const errors: string[] = [];

  if (!input.emailOrUsername || typeof input.emailOrUsername !== 'string') {
    errors.push('Email or username is required');
  }

  if (!input.password || typeof input.password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  return {
    emailOrUsername: input.emailOrUsername!,
    password: input.password!,
  };
};

/**
 * Validate refresh token input
 */
export const validateRefreshToken = (input: Partial<RefreshTokenInput>): RefreshTokenInput => {
  if (!input.refreshToken || typeof input.refreshToken !== 'string') {
    throw new ValidationError('Refresh token is required');
  }

  return {
    refreshToken: input.refreshToken,
  };
};

/**
 * Validate logout input
 */
export const validateLogout = (input: Partial<LogoutInput>): LogoutInput => {
  if (!input.refreshToken || typeof input.refreshToken !== 'string') {
    throw new ValidationError('Refresh token is required');
  }

  return {
    refreshToken: input.refreshToken,
    accessToken: input.accessToken,
  };
};

