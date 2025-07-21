import { body, param, query } from 'express-validator';

// Auth validation rules
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Имя пользователя должно быть от 3 до 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру')
];

export const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email или имя пользователя обязательны')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail()
];

export const resetPasswordValidation = [
  param('token')
    .notEmpty()
    .withMessage('Токен сброса обязателен'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру')
];

export const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Новый пароль должен быть не менее 6 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Новый пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру')
];

export const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Имя пользователя должно быть от 3 до 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail()
];

// Character validation rules
export const createCharacterValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 25 })
    .withMessage('Имя персонажа должно быть от 2 до 25 символов')
    .matches(/^[a-zA-Zа-яА-Я0-9_\s]+$/)
    .withMessage('Имя персонажа может содержать только буквы, цифры, пробелы и подчеркивания'),
  
  body('class')
    .isIn(['warrior', 'mage', 'archer', 'rogue', 'priest', 'paladin'])
    .withMessage('Выберите корректный класс персонажа')
];

export const updateCharacterValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID персонажа'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 25 })
    .withMessage('Имя персонажа должно быть от 2 до 25 символов')
    .matches(/^[a-zA-Zа-яА-Я0-9_\s]+$/)
    .withMessage('Имя персонажа может содержать только буквы, цифры, пробелы и подчеркивания')
];

// Guild validation rules
export const createGuildValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Название гильдии должно быть от 3 до 30 символов')
    .matches(/^[a-zA-Zа-яА-Я0-9_\s]+$/)
    .withMessage('Название гильдии может содержать только буквы, цифры, пробелы и подчеркивания'),
  
  body('tag')
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Тег гильдии должен быть от 2 до 5 символов')
    .isUppercase()
    .withMessage('Тег должен быть в верхнем регистре')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Тег может содержать только заглавные буквы и цифры'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов')
];

export const updateGuildValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID гильдии'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Название гильдии должно быть от 3 до 30 символов')
    .matches(/^[a-zA-Zа-яА-Я0-9_\s]+$/)
    .withMessage('Название гильдии может содержать только буквы, цифры, пробелы и подчеркивания'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов')
];

export const guildMemberValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID гильдии'),
  
  body('userId')
    .isMongoId()
    .withMessage('Некорректный ID пользователя'),
  
  body('role')
    .optional()
    .isIn(['leader', 'officer', 'member'])
    .withMessage('Некорректная роль в гильдии')
];

// Quest validation rules
export const createQuestValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Название квеста должно быть от 5 до 100 символов'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Описание квеста должно быть от 10 до 1000 символов'),
  
  body('type')
    .isIn(['main', 'side', 'daily', 'weekly', 'event'])
    .withMessage('Некорректный тип квеста'),
  
  body('difficulty')
    .isIn(['easy', 'normal', 'hard', 'expert', 'legendary'])
    .withMessage('Некорректная сложность квеста'),
  
  body('level')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Уровень квеста должен быть от 1 до 1000'),
  
  body('objectives')
    .isArray({ min: 1 })
    .withMessage('Квест должен содержать хотя бы одну цель'),
  
  body('objectives.*.type')
    .isIn(['kill', 'collect', 'deliver', 'talk', 'explore'])
    .withMessage('Некорректный тип цели квеста'),
  
  body('objectives.*.target')
    .notEmpty()
    .withMessage('Цель квеста не может быть пустой'),
  
  body('objectives.*.required')
    .isInt({ min: 1 })
    .withMessage('Требуемое количество должно быть больше 0')
];

// Item validation rules
export const createItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Название предмета должно быть от 2 до 50 символов'),
  
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Описание предмета должно быть от 5 до 500 символов'),
  
  body('type')
    .isIn(['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet', 'consumable', 'material', 'quest'])
    .withMessage('Некорректный тип предмета'),
  
  body('rarity')
    .isIn(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'])
    .withMessage('Некорректная редкость предмета'),
  
  body('level')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Уровень предмета должен быть от 1 до 1000')
];

// Chat validation rules
export const sendMessageValidation = [
  body('channel')
    .isIn(['global', 'guild', 'party', 'whisper', 'trade', 'help'])
    .withMessage('Некорректный канал чата'),
  
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Сообщение должно быть от 1 до 500 символов'),
  
  body('recipientId')
    .optional()
    .isMongoId()
    .withMessage('Некорректный ID получателя')
];

export const editMessageValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID сообщения'),
  
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Сообщение должно быть от 1 до 500 символов')
];

// Battle validation rules
export const createBattleValidation = [
  body('type')
    .isIn(['pve', 'pvp', 'guild_war', 'tournament', 'boss_raid'])
    .withMessage('Некорректный тип битвы'),
  
  body('targetId')
    .optional()
    .isMongoId()
    .withMessage('Некорректный ID цели')
];

export const battleActionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID битвы'),
  
  body('type')
    .isIn(['attack', 'skill', 'item', 'defend', 'flee'])
    .withMessage('Некорректный тип действия'),
  
  body('targetId')
    .optional()
    .isMongoId()
    .withMessage('Некорректный ID цели'),
  
  body('skillId')
    .optional()
    .notEmpty()
    .withMessage('ID навыка не может быть пустым'),
  
  body('itemId')
    .optional()
    .isMongoId()
    .withMessage('Некорректный ID предмета')
];

// Common validation rules
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID')
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть от 1 до 100'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'level', '-level'])
    .withMessage('Некорректное поле сортировки')
];

export const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Поисковый запрос должен быть от 1 до 100 символов')
];

// Admin validation rules
export const adminUserUpdateValidation = [
  param('id')
    .isMongoId()
    .withMessage('Некорректный ID пользователя'),
  
  body('role')
    .optional()
    .isIn(['player', 'moderator', 'admin'])
    .withMessage('Некорректная роль пользователя'),
  
  body('verified')
    .optional()
    .isBoolean()
    .withMessage('Статус подтверждения должен быть boolean')
];

export const adminStatsValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Некорректный период для статистики')
];