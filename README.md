# 🎮 Супер-Пупер Онлайн RPG Игра

Масштабная многопользовательская RPG игра с полным набором фич и современными технологиями!

## 🚀 Особенности

### 🎯 Игровая механика
- **Система персонажей**: 6 классов персонажей (Воин, Маг, Лучник, Вор, Жрец, Паладин)
- **Система уровней**: До 1000 уровней с прогрессией характеристик
- **Боевая система**: PvP и PvE бои в реальном времени
- **Система навыков**: Активные и пассивные навыки
- **Инвентарь**: 100 слотов с поддержкой стакирования
- **Экипировка**: 8 слотов для различных типов предметов

### 🏰 Социальные функции
- **Гильдии**: Создание и управление гильдиями до 100 игроков
- **Чат система**: Глобальный, гильдии, личные сообщения, торговля
- **Система торговли**: Обмен предметами между игроками
- **Рейтинги**: Таблицы лидеров по различным показателям

### 🗺️ Игровой мир
- **Квесты**: Основные, побочные, ежедневные, еженедельные, события
- **Монстры**: AI-система с разными типами поведения
- **Предметы**: 6 уровней редкости, от обычных до мифических
- **Достижения**: Система достижений с наградами

### 🔧 Технические особенности
- **Real-time**: Socket.IO для игры в реальном времени
- **Масштабируемость**: Redis для кеширования и сессий
- **Безопасность**: JWT аутентификация, rate limiting, валидация
- **API**: RESTful API с полной документацией
- **База данных**: MongoDB с оптимизированными индексами

## 🛠️ Технологии

### Backend
- **Node.js + TypeScript** - Основа сервера
- **Express.js** - REST API
- **Socket.IO** - Real-time коммуникация
- **MongoDB + Mongoose** - База данных
- **Redis** - Кеширование и сессии
- **JWT** - Аутентификация
- **Winston** - Логирование
- **Nodemailer** - Email уведомления

### Frontend (Планируется)
- **React + TypeScript** - UI
- **Socket.IO Client** - Real-time
- **Styled Components** - Стилизация
- **Zustand** - State management
- **React Query** - Data fetching

## 📦 Установка и запуск

### Предварительные требования
- Node.js 18+
- MongoDB 5+
- Redis 6+
- npm или yarn

### Быстрый старт

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd super-online-rpg-game
```

2. **Установка зависимостей**
```bash
npm run install:all
```

3. **Настройка окружения**
```bash
# Скопируйте example файлы
cp server/.env.example server/.env

# Настройте переменные окружения в server/.env:
# - MongoDB URI
# - Redis URL
# - JWT секреты
# - SMTP настройки
```

4. **Запуск в режиме разработки**
```bash
npm run dev
```

5. **Сборка для продакшена**
```bash
npm run build
npm start
```

## 🔧 Конфигурация

### Переменные окружения

```env
# База данных
MONGODB_URI=mongodb://localhost:27017/super-rpg-game
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Сервер
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Игровые настройки
MAX_PLAYERS_PER_ROOM=50
BATTLE_TIMEOUT=300000
EXP_MULTIPLIER=1.0
GOLD_MULTIPLIER=1.0
```

## 📊 Архитектура

```
server/
├── src/
│   ├── config/          # Конфигурация (DB, Redis)
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Middleware (auth, validation)
│   ├── models/         # Mongoose модели
│   ├── routes/         # API роуты
│   ├── services/       # Бизнес-логика
│   ├── socket/         # Socket.IO обработчики
│   ├── types/          # TypeScript типы
│   ├── utils/          # Утилиты
│   └── index.ts        # Точка входа
├── uploads/            # Загруженные файлы
├── logs/              # Логи приложения
└── dist/              # Скомпилированный код
```

## 🎮 API Эндпоинты

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/forgot-password` - Сброс пароля

### Персонажи
- `GET /api/characters` - Список персонажей
- `POST /api/characters` - Создание персонажа
- `PUT /api/characters/:id` - Обновление персонажа
- `DELETE /api/characters/:id` - Удаление персонажа

### Игра
- `GET /api/game/stats` - Игровая статистика
- `POST /api/game/level-up` - Повышение уровня
- `GET /api/game/leaderboard` - Рейтинги

### Гильдии
- `GET /api/guilds` - Список гильдий
- `POST /api/guilds` - Создание гильдии
- `PUT /api/guilds/:id` - Обновление гильдии
- `POST /api/guilds/:id/join` - Вступление в гильдию

### Квесты
- `GET /api/quests` - Доступные квесты
- `POST /api/quests/:id/accept` - Принять квест
- `PUT /api/quests/:id/complete` - Завершить квест

## 🔌 Socket.IO События

### Клиент → Сервер
- `select_character` - Выбор персонажа
- `send_message` - Отправка сообщения в чат
- `move_character` - Перемещение персонажа
- `challenge_player` - Вызов на бой
- `battle_action` - Действие в бою
- `trade_request` - Запрос обмена

### Сервер → Клиент
- `connected` - Подключение установлено
- `character_selected` - Персонаж выбран
- `new_message` - Новое сообщение в чате
- `player_entered` - Игрок появился в локации
- `battle_started` - Бой начался
- `round_processed` - Раунд обработан

## 📈 Производительность

### Оптимизация базы данных
- Индексы на часто запрашиваемые поля
- Агрегация для сложных запросов
- Пагинация для больших списков

### Кеширование
- Redis для сессий пользователей
- Кеширование статистик и рейтингов
- Кеширование конфигурации игры

### Безопасность
- Rate limiting для API
- Валидация всех входных данных
- Blacklist для токенов
- Защита от SQL injection и XSS

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:coverage

# E2E тесты
npm run test:e2e
```

## 📝 Логирование

Система использует Winston для структурированного логирования:
- `logs/error.log` - Ошибки
- `logs/combined.log` - Все логи
- Console output в режиме разработки

## 🚀 Деплой

### Docker
```bash
# Сборка образа
docker build -t super-rpg-game .

# Запуск с docker-compose
docker-compose up -d
```

### PM2 (Production)
```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start ecosystem.config.js

# Мониторинг
pm2 monit
```

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📜 Лицензия

Этот проект лицензирован под MIT License. См. файл [LICENSE](LICENSE) для деталей.

## 👥 Команда

- **Lead Developer**: Super Game Developer
- **Backend**: Node.js/TypeScript экспертиза
- **Frontend**: React/TypeScript экспертиза
- **Game Design**: RPG механика и баланс
- **DevOps**: Развертывание и мониторинг

## 📞 Поддержка

- **Email**: support@supergame.com
- **Discord**: [Game Server](https://discord.gg/supergame)
- **Issues**: [GitHub Issues](https://github.com/username/repo/issues)

## 🎯 Roadmap

### Версия 1.1
- [ ] Система крафта предметов
- [ ] Дома/базы игроков
- [ ] Питомцы и спутники
- [ ] Система брака

### Версия 1.2
- [ ] Мобильное приложение
- [ ] VR поддержка
- [ ] Blockchain интеграция
- [ ] NFT предметы

### Версия 2.0
- [ ] 3D графика
- [ ] Голосовой чат
- [ ] Потоковое видео
- [ ] AI-генерированный контент

---

**Сделано с ❤️ для лучшего игрового опыта!** 🎮✨
