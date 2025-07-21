import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/super-rpg-game';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    logger.info('🍃 MongoDB успешно подключена');

    // Handle MongoDB connection events
    mongoose.connection.on('error', (error) => {
      logger.error('❌ Ошибка подключения к MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB отключена');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB переподключена');
    });

    // Close connection on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('📄 Соединение с MongoDB закрыто через SIGINT');
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      logger.info('📄 Соединение с MongoDB закрыто через SIGTERM');
    });

  } catch (error) {
    logger.error('❌ Не удалось подключиться к MongoDB:', error);
    throw error;
  }
};