import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });

    redisClient.on('error', (error) => {
      logger.error('❌ Ошибка Redis:', error);
    });

    redisClient.on('connect', () => {
      logger.info('🔗 Подключение к Redis установлено');
    });

    redisClient.on('ready', () => {
      logger.info('⚡ Redis готов к работе');
    });

    redisClient.on('end', () => {
      logger.warn('⚠️ Соединение с Redis завершено');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Переподключение к Redis...');
    });

    await redisClient.connect();
    logger.info('🔴 Redis успешно подключен');

  } catch (error) {
    logger.error('❌ Не удалось подключиться к Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis клиент не инициализирован');
  }
  return redisClient;
};

// Utility functions for common Redis operations
export const redisUtils = {
  // Set value with expiration
  async setWithExpiry(key: string, value: string, expirySeconds: number): Promise<void> {
    await redisClient.setEx(key, expirySeconds, value);
  },

  // Get value
  async get(key: string): Promise<string | null> {
    return await redisClient.get(key);
  },

  // Delete key
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  // Set hash
  async hSet(key: string, field: string, value: string): Promise<void> {
    await redisClient.hSet(key, field, value);
  },

  // Get hash field
  async hGet(key: string, field: string): Promise<string | null> {
    return await redisClient.hGet(key, field);
  },

  // Get all hash fields
  async hGetAll(key: string): Promise<Record<string, string>> {
    return await redisClient.hGetAll(key);
  },

  // Delete hash field
  async hDel(key: string, field: string): Promise<void> {
    await redisClient.hDel(key, field);
  },

  // Add to set
  async sAdd(key: string, member: string): Promise<void> {
    await redisClient.sAdd(key, member);
  },

  // Remove from set
  async sRem(key: string, member: string): Promise<void> {
    await redisClient.sRem(key, member);
  },

  // Get set members
  async sMembers(key: string): Promise<string[]> {
    return await redisClient.sMembers(key);
  },

  // Check if member exists in set
  async sIsMember(key: string, member: string): Promise<boolean> {
    return await redisClient.sIsMember(key, member);
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    return await redisClient.incr(key);
  },

  // Set expiry
  async expire(key: string, seconds: number): Promise<void> {
    await redisClient.expire(key, seconds);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    return (await redisClient.exists(key)) === 1;
  }
};