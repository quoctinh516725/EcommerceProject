import redis from '../config/redis';

const BLACKLIST_PREFIX = 'blacklist:token:';

/**
 * Add access token to blacklist
 * @param token - The access token to blacklist
 * @param ttl - Time to live in seconds (remaining time until token expires)
 */
export const addToBlacklist = async (token: string, ttl: number): Promise<void> => {
  if (ttl <= 0) {
    return; // Token already expired, no need to blacklist
  }
  
  const key = `${BLACKLIST_PREFIX}${token}`;
  await redis.setex(key, ttl, '1');
};

/**
 * Check if token is in blacklist
 * @param token - The access token to check
 * @returns true if token is blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const key = `${BLACKLIST_PREFIX}${token}`;
  const result = await redis.get(key);
  return result !== null;
};

/**
 * Remove token from blacklist (optional, usually not needed)
 */
export const removeFromBlacklist = async (token: string): Promise<void> => {
  const key = `${BLACKLIST_PREFIX}${token}`;
  await redis.del(key);
};

