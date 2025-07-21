import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Супер RPG Игра" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.message
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email отправлен: ${info.messageId} -> ${options.email}`);
  } catch (error) {
    logger.error('Ошибка отправки email:', error);
    throw new Error('Не удалось отправить email');
  }
};

// Send welcome email
export const sendWelcomeEmail = async (username: string, email: string): Promise<void> => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Добро пожаловать в Супер RPG Игру!</h1>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>Привет, ${username}! 🎮</h2>
        <p>Добро пожаловать в удивительный мир приключений!</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3>🚀 Что вас ждет:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0;">⚔️ Эпические битвы с монстрами</li>
          <li style="margin: 10px 0;">🏰 Увлекательные квесты</li>
          <li style="margin: 10px 0;">👥 Система гильдий</li>
          <li style="margin: 10px 0;">💎 Редкие предметы и экипировка</li>
          <li style="margin: 10px 0;">🏆 Достижения и рейтинги</li>
          <li style="margin: 10px 0;">💬 Общение с другими игроками</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CORS_ORIGIN}/game" 
           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Начать играть! 🎯
        </a>
      </div>
      
      <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4>💡 Советы новичку:</h4>
        <p>1. Создайте своего первого персонажа</p>
        <p>2. Выполните обучающие квесты</p>
        <p>3. Найдите гильдию для совместных приключений</p>
        <p>4. Исследуйте мир и сражайтесь с монстрами</p>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p>С уважением, команда Супер RPG Игры</p>
        <p>Если у вас есть вопросы, свяжитесь с нами: support@supergame.com</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: '🎮 Добро пожаловать в Супер RPG Игру!',
    message
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  username: string, 
  email: string, 
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.CORS_ORIGIN}/reset-password/${resetToken}`;
  
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">🔐 Сброс пароля</h1>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>Привет, ${username}!</h2>
        <p>Вы запросили сброс пароля для вашего аккаунта.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Сбросить пароль 🔑
        </a>
      </div>
      
      <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4>⚠️ Важно:</h4>
        <p>• Ссылка действительна только 10 минут</p>
        <p>• Если вы не запрашивали сброс пароля, проигнорируйте это письмо</p>
        <p>• Ваш пароль останется неизменным до перехода по ссылке</p>
      </div>
      
      <div style="color: #666; font-size: 14px; margin: 20px 0;">
        <p>Или скопируйте и вставьте эту ссылку в ваш браузер:</p>
        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
          ${resetUrl}
        </p>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p>Команда безопасности Супер RPG Игры</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: '🔐 Сброс пароля - Супер RPG Игра',
    message
  });
};

// Send level up notification
export const sendLevelUpEmail = async (
  username: string,
  email: string,
  characterName: string,
  newLevel: number
): Promise<void> => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">🎉 Поздравляем с повышением уровня!</h1>
      
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
        <h2>🌟 ${characterName} достиг ${newLevel} уровня! 🌟</h2>
        <p style="font-size: 18px;">Отличная работа, ${username}!</p>
      </div>
      
      <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3>🎁 Что нового на ${newLevel} уровне:</h3>
        <ul>
          <li>Увеличены характеристики персонажа</li>
          <li>Доступны новые навыки</li>
          <li>Открыты новые области для исследования</li>
          <li>Возможность использовать более мощную экипировку</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CORS_ORIGIN}/character" 
           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Посмотреть персонажа 📊
        </a>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p>Продолжайте приключения и достигайте новых высот!</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: `🎉 ${characterName} достиг ${newLevel} уровня!`,
    message
  });
};

// Send guild invitation email
export const sendGuildInvitationEmail = async (
  username: string,
  email: string,
  guildName: string,
  inviterName: string
): Promise<void> => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">🏰 Приглашение в гильдию</h1>
      
      <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>Привет, ${username}!</h2>
        <p><strong>${inviterName}</strong> приглашает вас вступить в гильдию <strong>"${guildName}"</strong>!</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3>🤝 Преимущества гильдии:</h3>
        <ul>
          <li>Совместные квесты и рейды</li>
          <li>Обмен ресурсами и предметами</li>
          <li>Групповой чат и общение</li>
          <li>Взаимная поддержка в сражениях</li>
          <li>Престиж и соревнования между гильдиями</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CORS_ORIGIN}/guilds" 
           style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Принять приглашение 🏰
        </a>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p>Войдите в игру, чтобы ответить на приглашение</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: `🏰 Приглашение в гильдию "${guildName}"`,
    message
  });
};