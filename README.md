# ChessNexus

Онлайн шахматная платформа, разработанная с использованием Nuxt 3, Vue 3 и TypeScript. Включает в себя рейтинговую систему, профили пользователей и социальные функции.

## Возможности

### Шахматная игра

- Игра в реальном времени с соблюдением стандартных правил
- Контроль времени (15, 30, 45, 90 минут)
- Поддержка всех шахматных ходов:
  - Рокировка
  - Взятие на проходе
  - Превращение пешки
- Проверка корректности ходов
- Определение шаха, мата и пата

### Пользовательские функции

- Авторизация через:
  - Email
  - GitHub
  - Google
  - VK
- Профили пользователей со статистикой
- Рейтинговая система
- Система друзей с отслеживанием статуса
- Личные сообщения между пользователями

### Интерфейс

- Адаптивный дизайн (ПК и мобильные устройства)
- Тёмная и светлая темы
- Поддержка русского и английского языков
- Приглашения на игру в реальном времени
- Чат во время игры (разделён на общее соединение для уведомлений, и приватное для тет-а-тет)
- История ходов
- Отображение взятых фигур

## Технологии

### Фронтенд

- Nuxt 3
- Vue 3
- TypeScript
- Tailwind CSS
- Pinia (управление состоянием)
- @nuxt/ui (библиотека компонентов)

### Бэкенд

- Node.js
- MongoDB с Mongoose
- JWT аутентификация
- Server-Sent Events (SSE) для обновлений в реальном времени

## Установка

1. Клонирование репозитория:

```bash
git clone https://github.com/yourusername/chessnexus.git
```

2. Установка зависимостей:

```bash
cd chessnexus
npm install
```

3. Создание файла `.env` в корневой директории:

```env
API_BASE='/api'
MONGODB_URI='ваш_mongodb_uri'
JWT_SECRET='ваш_jwt_secret'
GITHUB_CLIENT_ID='ваш_github_client_id'
GITHUB_CLIENT_SECRET='ваш_github_client_secret'
GITHUB_REDIRECT_URI='http://localhost:3000/auth/github/callback'
GOOGLE_CLIENT_ID='ваш_google_client_id'
GOOGLE_CLIENT_SECRET='ваш_google_client_secret'
GOOGLE_REDIRECT_URI='http://localhost:3000/auth/google/callback'
VK_CLIENT_ID='ваш_vk_client_id'
VK_CLIENT_SECRET='ваш_vk_client_secret'
VK_REDIRECT_URI='http://localhost:3000/auth/vk/callback'
```

4. Запуск в режиме разработки:

```bash
npm run dev
```

5. Сборка для продакшена:

```bash
npm run build
```

## Структура проекта

```
├── app/
│   ├── styles/          # Глобальные стили
│   └── types/           # TypeScript типы
├── composables/         # Vue компоненты
├── features/           # Компоненты по функционалу
│   ├── auth/           # Компоненты авторизации
│   ├── chat/           # Функционал чата
│   ├── game/           # Игровые компоненты
│   └── user/           # Пользовательские компоненты
├── server/             # Backend API и сервисы
│   ├── api/            # API эндпоинты
│   ├── db/             # Модели базы данных
│   └── services/       # Бизнес-логика
└── store/              # Хранилища Pinia
```

## Разработка

### Структура API

- RESTful API эндпоинты в `/server/api/`
- SSE эндпоинты для обновлений в реальном времени
- Сервисный слой для бизнес-логики
- MongoDB модели с использованием Mongoose

### Управление состоянием

- Хранилища Pinia для глобального состояния
- Composables для переиспользуемой логики
- SSE для обновлений в реальном времени
