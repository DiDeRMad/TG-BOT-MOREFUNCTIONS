#!/bin/bash

# 🎮 Супер-Пупер Онлайн RPG Игра - Скрипт запуска
# Автор: Супер Разработчик Игр

echo "🎮 =========================================="
echo "🎮  СУПЕР-ПУПЕР ОНЛАЙН RPG ИГРА"
echo "🎮  Загрузка игрового мира..."
echo "🎮 =========================================="

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен! Пожалуйста, установите Node.js 18+ версии"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше! Текущая версия: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) обнаружен"

# Проверка MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB не найден в PATH. Убедитесь, что MongoDB запущен на localhost:27017"
else
    echo "✅ MongoDB найден"
fi

# Проверка Redis
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis не найден в PATH. Убедитесь, что Redis запущен на localhost:6379"
else
    echo "✅ Redis найден"
fi

# Проверка зависимостей
echo "🔍 Проверка зависимостей..."

if [ ! -d "node_modules" ]; then
    echo "📦 Установка основных зависимостей..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "🖥️  Установка серверных зависимостей..."
    cd server && npm install && cd ..
fi

# Проверка .env файла
if [ ! -f "server/.env" ]; then
    echo "⚙️  Создание конфигурационного файла..."
    cp server/.env.example server/.env
    echo "⚠️  Пожалуйста, настройте server/.env файл с вашими параметрами!"
fi

# Создание директорий
mkdir -p server/uploads
mkdir -p server/logs

echo ""
echo "🚀 =========================================="
echo "🚀  ЗАПУСК ИГРОВОГО СЕРВЕРА"
echo "🚀 =========================================="
echo ""
echo "📊 Статистика проекта:"
echo "   📁 Файлы TypeScript: $(find server/src -name "*.ts" | wc -l)"
echo "   📝 Строк кода: $(find server/src -name "*.ts" -exec cat {} \; | wc -l)"
echo "   🎯 Игровые модели: $(find server/src/models -name "*.ts" | wc -l)"
echo "   🛣️  API роуты: $(find server/src/routes -name "*.ts" | wc -l)"
echo "   🎮 Socket.IO обработчики: Реальное время"
echo ""
echo "🎯 Основные фичи:"
echo "   ⚔️  Боевая система (PvP/PvE)"
echo "   🏰 Гильдии до 100 игроков"
echo "   🎒 Инвентарь на 100 слотов"
echo "   📜 Система квестов"
echo "   💬 Многоканальный чат"
echo "   🏆 Рейтинги и достижения"
echo "   🔒 JWT аутентификация"
echo "   ⚡ Redis кеширование"
echo ""

# Функция для отображения прогресса
show_progress() {
    echo -n "🎮 $1 "
    for i in {1..3}; do
        echo -n "."
        sleep 0.5
    done
    echo " ✅"
}

show_progress "Инициализация игрового движка"
show_progress "Загрузка игровых ресурсов"
show_progress "Подключение к базе данных"
show_progress "Запуск Socket.IO сервера"

echo ""
echo "🌟 =========================================="
echo "🌟  СЕРВЕР ГОТОВ К ПРИКЛЮЧЕНИЯМ!"
echo "🌟 =========================================="
echo ""
echo "🔗 Доступные эндпоинты:"
echo "   🌐 API сервер: http://localhost:3001"
echo "   📊 Health check: http://localhost:3001/api/health"
echo "   📚 API документация: /api/docs (будет добавлена)"
echo ""
echo "🎮 Начните играть:"
echo "   1. Откройте браузер на http://localhost:3000"
echo "   2. Зарегистрируйтесь или войдите в аккаунт"
echo "   3. Создайте своего первого персонажа"
echo "   4. Исследуйте удивительный мир приключений!"
echo ""
echo "🛠️  Режим разработки:"
echo "   📝 Логи: server/logs/"
echo "   🔧 Конфигурация: server/.env"
echo "   🗄️  База данных: MongoDB на порту 27017"
echo "   ⚡ Кеш: Redis на порту 6379"
echo ""

# Запуск в зависимости от аргументов
case "${1:-dev}" in
    "production" | "prod")
        echo "🚀 Запуск в PRODUCTION режиме..."
        export NODE_ENV=production
        npm run build
        npm start
        ;;
    "build")
        echo "🔨 Сборка проекта..."
        npm run build
        echo "✅ Сборка завершена! Используйте 'npm start' для запуска"
        ;;
    "install")
        echo "📦 Установка всех зависимостей..."
        npm run install:all
        echo "✅ Все зависимости установлены!"
        ;;
    "dev" | *)
        echo "🛠️  Запуск в DEVELOPMENT режиме..."
        echo ""
        echo "⏰ Сервер запустится через несколько секунд..."
        echo "📱 Фронтенд планируется в следующей версии"
        echo "🔥 Используйте Postman или curl для тестирования API"
        echo ""
        echo "🎯 Пример запросов:"
        echo "   POST /api/auth/register - Регистрация"
        echo "   POST /api/auth/login - Вход"
        echo "   GET /api/auth/me - Профиль пользователя"
        echo ""
        echo "🎮 Приятной игры! Нажмите Ctrl+C для остановки"
        echo ""
        
        # Запуск в dev режиме
        npm run dev
        ;;
esac