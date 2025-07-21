import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { connectDatabase } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { setupSocketHandlers } from '@/socket/socketHandlers';
import { errorHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import gameRoutes from '@/routes/game';
import characterRoutes from '@/routes/character';
import inventoryRoutes from '@/routes/inventory';
import questRoutes from '@/routes/quest';
import guildRoutes from '@/routes/guild';
import shopRoutes from '@/routes/shop';
import battleRoutes from '@/routes/battle';
import chatRoutes from '@/routes/chat';
import adminRoutes from '@/routes/admin';
import leaderboardRoutes from '@/routes/leaderboard';
import achievementRoutes from '@/routes/achievement';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.IO setup
setupSocketHandlers(io);

// Global error handler
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Эндпоинт не найден'
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Сервер запущен на порту ${PORT}`);
      logger.info(`🎮 Игровой режим: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Socket.IO сервер готов к подключениям`);
    });
  } catch (error) {
    logger.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 Получен сигнал SIGTERM, завершаем сервер...');
  server.close(() => {
    logger.info('✅ Сервер успешно завершен');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('🛑 Получен сигнал SIGINT, завершаем сервер...');
  server.close(() => {
    logger.info('✅ Сервер успешно завершен');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанный отказ Promise:', reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение:', error);
  server.close(() => {
    process.exit(1);
  });
});

startServer();