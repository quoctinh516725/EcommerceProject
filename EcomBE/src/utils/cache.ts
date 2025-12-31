import redis from '../config/redis';

const CACHE_PREFIX = 'cache:';
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get cached data
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await redis.get(`${CACHE_PREFIX}${key}`);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Set cached data
 */
export const setCache = async (key: string, data: any, ttl: number = DEFAULT_TTL): Promise<void> => {
  try {
    await redis.setex(`${CACHE_PREFIX}${key}`, ttl, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    // Don't throw - caching is not critical
  }
};

/**
 * Delete cached data
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
    // Don't throw - caching is not critical
  }
};

/**
 * Delete cache by pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Error deleting cache pattern ${pattern}:`, error);
    // Don't throw - caching is not critical
  }
};



