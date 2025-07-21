import { Request, Response } from 'express';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import User from '@/models/User';
import Character from '@/models/Character';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { 
  generateToken, 
  generateRefreshToken, 
  blacklistToken, 
  blacklistRefreshToken,
  clearRateLimit 
} from '@/middleware/auth';
import { sendEmail } from '@/utils/email';
import { logger } from '@/utils/logger';
import { redisUtils } from '@/config/redis';

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Ошибки валидации', 400);
  }

  const { username, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new CustomError('Пользователь с таким email уже существует', 400);
    }
    if (existingUser.username === username) {
      throw new CustomError('Пользователь с таким именем уже существует', 400);
    }
  }

  // Create verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    verificationToken,
    verified: process.env.NODE_ENV === 'development' // Auto-verify in development
  });

  // Send verification email in production
  if (process.env.NODE_ENV !== 'development') {
    try {
      await sendEmail({
        email: user.email,
        subject: 'Подтверждение регистрации - Супер RPG Игра',
        message: `
          <h1>Добро пожаловать в Супер RPG Игру!</h1>
          <p>Здравствуйте, ${user.username}!</p>
          <p>Для завершения регистрации, пожалуйста, подтвердите ваш email, перейдя по ссылке:</p>
          <a href="${process.env.CORS_ORIGIN}/verify-email/${verificationToken}">Подтвердить Email</a>
          <p>Если вы не регистрировались на нашем сайте, проигнорируйте это сообщение.</p>
        `
      });
    } catch (error) {
      logger.error('Ошибка отправки email:', error);
      // Don't fail registration if email fails
    }
  }

  // Generate tokens
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Set cookie
  res.cookie('token', token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Store refresh token in Redis
  await redisUtils.setWithExpiry(`refresh_token:${user._id}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

  logger.info(`Пользователь зарегистрирован: ${user.username} (${user.email})`);

  res.status(201).json({
    success: true,
    data: {
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
        role: user.role,
        avatar: user.avatar
      }
    }
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Email/имя пользователя и пароль обязательны', 400);
  }

  const { identifier, password } = req.body; // identifier can be email or username

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new CustomError('Неверные учетные данные', 401);
  }

  if (!user.verified) {
    throw new CustomError('Пожалуйста, подтвердите ваш email перед входом', 401);
  }

  // Clear rate limiting on successful login
  await clearRateLimit(req.ip);

  // Update last seen
  await user.updateLastSeen();

  // Generate tokens
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Set cookie
  res.cookie('token', token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Store refresh token
  await redisUtils.setWithExpiry(`refresh_token:${user._id}`, refreshToken, 30 * 24 * 60 * 60);

  // Get user's characters
  const characters = await Character.find({ userId: user._id }).select('name class level');

  logger.info(`Пользователь вошел: ${user.username}`);

  res.json({
    success: true,
    data: {
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
        role: user.role,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      },
      characters
    }
  });
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
  const { refreshToken } = req.body;

  // Blacklist tokens
  if (token) {
    await blacklistToken(token);
  }
  
  if (refreshToken) {
    await blacklistRefreshToken(refreshToken);
    await redisUtils.del(`refresh_token:${req.user._id}`);
  }

  // Set user offline
  if (req.user) {
    await req.user.setOffline();
    await redisUtils.del(`user_online:${req.user._id}`);
  }

  // Clear cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  logger.info(`Пользователь вышел: ${req.user?.username}`);

  res.json({
    success: true,
    message: 'Успешный выход'
  });
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const oldRefreshToken = req.refreshToken;

  // Blacklist old refresh token
  await blacklistRefreshToken(oldRefreshToken);

  // Generate new tokens
  const token = generateToken(req.user._id.toString());
  const refreshToken = generateRefreshToken(req.user._id.toString());

  // Store new refresh token
  await redisUtils.setWithExpiry(`refresh_token:${req.user._id}`, refreshToken, 30 * 24 * 60 * 60);

  // Set new cookie
  res.cookie('token', token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({
    success: true,
    data: {
      token,
      refreshToken
    }
  });
});

// Verify email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    throw new CustomError('Токен подтверждения отсутствует', 400);
  }

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    throw new CustomError('Недействительный или истекший токен', 400);
  }

  // Verify user
  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  logger.info(`Email подтвержден: ${user.username}`);

  res.json({
    success: true,
    message: 'Email успешно подтвержден'
  });
});

// Resend verification email
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError('Пользователь не найден', 404);
  }

  if (user.verified) {
    throw new CustomError('Email уже подтвержден', 400);
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.verificationToken = verificationToken;
  await user.save();

  // Send verification email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Повторная отправка подтверждения - Супер RPG Игра',
      message: `
        <h1>Подтверждение Email</h1>
        <p>Здравствуйте, ${user.username}!</p>
        <p>Для подтверждения вашего email, перейдите по ссылке:</p>
        <a href="${process.env.CORS_ORIGIN}/verify-email/${verificationToken}">Подтвердить Email</a>
      `
    });

    res.json({
      success: true,
      message: 'Email для подтверждения отправлен'
    });
  } catch (error) {
    user.verificationToken = undefined;
    await user.save();
    
    logger.error('Ошибка отправки email:', error);
    throw new CustomError('Ошибка отправки email', 500);
  }
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists
    res.json({
      success: true,
      message: 'Если email существует, инструкции отправлены'
    });
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.save();

  // Send reset email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Сброс пароля - Супер RPG Игра',
      message: `
        <h1>Сброс пароля</h1>
        <p>Здравствуйте, ${user.username}!</p>
        <p>Вы запросили сброс пароля. Для сброса пароля перейдите по ссылке:</p>
        <a href="${process.env.CORS_ORIGIN}/reset-password/${resetToken}">Сбросить пароль</a>
        <p>Ссылка действительна в течение 10 минут.</p>
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это сообщение.</p>
      `
    });

    logger.info(`Запрос сброса пароля: ${user.username}`);
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.error('Ошибка отправки email сброса пароля:', error);
    throw new CustomError('Ошибка отправки email', 500);
  }

  res.json({
    success: true,
    message: 'Если email существует, инструкции отправлены'
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new CustomError('Недействительный или истекший токен', 400);
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Generate new tokens
  const jwtToken = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Store refresh token
  await redisUtils.setWithExpiry(`refresh_token:${user._id}`, refreshToken, 30 * 24 * 60 * 60);

  logger.info(`Пароль сброшен: ${user.username}`);

  res.json({
    success: true,
    data: {
      token: jwtToken,
      refreshToken
    },
    message: 'Пароль успешно сброшен'
  });
});

// Update password
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new CustomError('Пользователь не найден', 404);
  }

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new CustomError('Неверный текущий пароль', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Пароль обновлен: ${user.username}`);

  res.json({
    success: true,
    message: 'Пароль успешно обновлен'
  });
});

// Get current user
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // Update online status
  await redisUtils.setWithExpiry(`user_online:${req.user._id}`, 'true', 300);

  // Get user's characters
  const characters = await Character.find({ userId: req.user._id }).select('name class level experience gold');

  res.json({
    success: true,
    data: {
      user: req.user,
      characters
    }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { username, email } = req.body;
  const fieldsToUpdate: any = {};

  if (username && username !== req.user.username) {
    // Check if username is taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new CustomError('Имя пользователя уже занято', 400);
    }
    fieldsToUpdate.username = username;
  }

  if (email && email !== req.user.email) {
    // Check if email is taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new CustomError('Email уже используется', 400);
    }
    
    fieldsToUpdate.email = email;
    fieldsToUpdate.verified = false;
    
    // Generate verification token for new email
    const verificationToken = crypto.randomBytes(20).toString('hex');
    fieldsToUpdate.verificationToken = verificationToken;

    // Send verification email
    try {
      await sendEmail({
        email: email,
        subject: 'Подтверждение нового email - Супер RPG Игра',
        message: `
          <h1>Подтверждение нового Email</h1>
          <p>Здравствуйте, ${req.user.username}!</p>
          <p>Для подтверждения нового email, перейдите по ссылке:</p>
          <a href="${process.env.CORS_ORIGIN}/verify-email/${verificationToken}">Подтвердить Email</a>
        `
      });
    } catch (error) {
      logger.error('Ошибка отправки email подтверждения:', error);
      throw new CustomError('Ошибка отправки email подтверждения', 500);
    }
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    throw new CustomError('Нет полей для обновления', 400);
  }

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  logger.info(`Профиль обновлен: ${user!.username}`);

  res.json({
    success: true,
    data: user,
    message: 'Профиль успешно обновлен'
  });
});

// Delete account
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new CustomError('Пользователь не найден', 404);
  }

  // Verify password
  if (!(await user.comparePassword(password))) {
    throw new CustomError('Неверный пароль', 400);
  }

  // Delete user's characters
  await Character.deleteMany({ userId: user._id });

  // Delete user
  await user.deleteOne();

  // Clear all user sessions
  await redisUtils.del(`refresh_token:${user._id}`);
  await redisUtils.del(`user_online:${user._id}`);

  logger.info(`Аккаунт удален: ${user.username}`);

  res.json({
    success: true,
    message: 'Аккаунт успешно удален'
  });
});