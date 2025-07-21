import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { CustomError, asyncHandler } from '@/middleware/errorHandler';
import User from '@/models/User';
import { redisUtils } from '@/config/redis';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
};

// Authentication middleware
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new CustomError('Не авторизован, токен отсутствует', 401);
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Check if token is blacklisted
    const isBlacklisted = await redisUtils.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new CustomError('Токен недействителен', 401);
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new CustomError('Пользователь не найден', 401);
    }

    // Check if user is verified
    if (!user.verified) {
      throw new CustomError('Пользователь не подтвержден', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError('Недействительный токен', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new CustomError('Токен истек', 401);
    }
    throw error;
  }
});

// Optional authentication (for public endpoints that benefit from user context)
export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const isBlacklisted = await redisUtils.get(`blacklist:${token}`);
      
      if (!isBlacklisted) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.verified) {
          req.user = user;
        }
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next();
});

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new CustomError('Не авторизован', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new CustomError('Недостаточно прав для этого действия', 403);
    }

    next();
  };
};

// Check if user owns resource
export const checkOwnership = (resourceModel: any, resourceIdParam: string = 'id') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[resourceIdParam];
    const resource = await resourceModel.findById(resourceId);

    if (!resource) {
      throw new CustomError('Ресурс не найден', 404);
    }

    // Check ownership
    if (resource.userId && resource.userId.toString() !== req.user._id.toString()) {
      throw new CustomError('Доступ запрещен', 403);
    }

    req.resource = resource;
    next();
  });
};

// Rate limiting middleware
export const rateLimitAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const key = `auth_attempts:${req.ip}`;
  const attempts = await redisUtils.get(key);
  const maxAttempts = 5;
  const windowTime = 900; // 15 minutes

  if (attempts && parseInt(attempts) >= maxAttempts) {
    throw new CustomError('Слишком много попыток входа. Попробуйте позже.', 429);
  }

  // Store attempt count
  if (!attempts) {
    await redisUtils.setWithExpiry(key, '1', windowTime);
  } else {
    await redisUtils.setWithExpiry(key, (parseInt(attempts) + 1).toString(), windowTime);
  }

  next();
});

// Clear rate limit on successful login
export const clearRateLimit = async (ip: string) => {
  await redisUtils.del(`auth_attempts:${ip}`);
};

// Blacklist token
export const blacklistToken = async (token: string) => {
  // Store token in blacklist for the duration of its remaining life
  try {
    const decoded = verifyToken(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await redisUtils.setWithExpiry(`blacklist:${token}`, 'true', expiresIn);
    }
  } catch (error) {
    // Token is already invalid, no need to blacklist
  }
};

// Refresh token middleware
export const refreshTokenMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new CustomError('Refresh token отсутствует', 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if refresh token is blacklisted
    const isBlacklisted = await redisUtils.get(`refresh_blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new CustomError('Refresh token недействителен', 401);
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new CustomError('Пользователь не найден', 401);
    }

    if (!user.verified) {
      throw new CustomError('Пользователь не подтвержден', 401);
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError('Недействительный refresh token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new CustomError('Refresh token истек', 401);
    }
    throw error;
  }
});

// Blacklist refresh token
export const blacklistRefreshToken = async (refreshToken: string) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await redisUtils.setWithExpiry(`refresh_blacklist:${refreshToken}`, 'true', expiresIn);
    }
  } catch (error) {
    // Token is already invalid, no need to blacklist
  }
};

// Online status middleware
export const updateOnlineStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    // Update last seen and online status in Redis
    await redisUtils.setWithExpiry(`user_online:${req.user._id}`, 'true', 300); // 5 minutes
    
    // Update user's last seen in database (less frequently)
    const lastUpdate = await redisUtils.get(`last_seen_update:${req.user._id}`);
    if (!lastUpdate) {
      await User.findByIdAndUpdate(req.user._id, {
        lastSeen: new Date(),
        isOnline: true
      });
      await redisUtils.setWithExpiry(`last_seen_update:${req.user._id}`, 'true', 60); // Update every minute
    }
  }
  next();
});