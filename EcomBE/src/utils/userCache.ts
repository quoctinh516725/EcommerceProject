import redis from '../config/redis';
import { UserStatus } from '../constants';

const USER_CACHE_PREFIX = 'user:cache:';

export interface UserCacheData {
  userId: string;
  status: UserStatus;
  roles: string[];
  shopId?: string; // Shop ID if user is a seller
}

export const saveUserCache = async (
  userId: string,
  data: UserCacheData,
  ttl: number
): Promise<void> => {
  if (ttl <= 0) {
    return; // Token already expired, no need to cache
  }

  const key = `${USER_CACHE_PREFIX}${userId}`;
  const cacheData = JSON.stringify(data);
  await redis.setex(key, ttl, cacheData);
};


export const getUserCache = async (
  userId: string
): Promise<UserCacheData | null> => {
  const key = `${USER_CACHE_PREFIX}${userId}`;
  const result = await redis.get(key);

  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result) as UserCacheData;
  } catch (error) {
    console.error('Error parsing user cache:', error);
    return null;
  }
};

export const deleteUserCache = async (userId: string): Promise<void> => {
  const key = `${USER_CACHE_PREFIX}${userId}`;
  await redis.del(key);
};

export const isUserActive = async (userId: string): Promise<boolean> => {
  const cache = await getUserCache(userId);
  return cache !== null && cache.status === UserStatus.ACTIVE;
};

