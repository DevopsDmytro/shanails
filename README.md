# Шанейлз (Shanails) - Система запису до салону краси

Сучасна система управління записами до салону краси з інтеграцією Telegram бота та веб-інтерфейсом.

## 🚀 Функціонал

### Для клієнтів
- 📅 Перегляд доступних послуг та майстрів
- 🕐 Вибір зручного часу для запису
- 💬 Запис через Telegram бота
- 🌐 Веб-інтерфейс для запису
- 🔔 Автоматичні нагадування про записи
- ⭐ Залишення відгуків після послуг

### Для адміністраторів
- 👥 Управління майстрами та їхнім графіком
- 💅 Управління послугами та цінами
- 📋 Управління записами
- 📊 Аналітика та статистика
- 🚫 Блокування ненадійних клієнтів

## 🛠 Технологічний стек

### Backend
- **Node.js 18+ LTS** - Runtime середовище
- **Express.js** - Web фреймворк
- **PostgreSQL** - База даних
- **Prisma ORM** - Робота з базою даних
- **JWT** - Аутентифікація
- **node-telegram-bot-api** - Telegram бот

### Frontend
- **Vite** - Інструмент збірки
- **Vanilla JavaScript** - Без фреймворків
- **HTML5/CSS3** - Сучасні стандарти
- **Telegram Mini App SDK** - Інтеграція з Telegram

### DevOps
- **Docker** - Контейнеризація
- **Docker Compose** - Оркестрація
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD

## 📦 Встановлення та запуск

### Передумови
- Node.js 18+ LTS
- Docker та Docker Compose
- Git

### Швидкий старт

1. **Клонування репозиторію**
   ```bash
   git clone <repository-url>
   cd shanails
   ```

2. **Налаштування оточення**
   ```bash
   cp .env.example .env
   # Відредагуйте .env файл з вашими налаштуваннями
   ```

3. **Запуск в режимі розробки**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

4. **Запуск в production режимі**
   ```bash
   docker-compose up -d
   ```

### Доступ до сервісів
- **Frontend**: http://localhost:5173 (dev) / http://localhost:80 (prod)
- **Backend API**: http://localhost:3000
- **API документація**: http://localhost:3000/api-docs
- **Admin панель**: http://localhost:3000/admin
- **Telegram бот**: Знайдіть бота за токеном у .env

## 📁 Структура проєкту

```
shanails/
├── backend/                 # Backend сервіс
│   ├── src/
│   │   ├── models/         # Моделі даних
│   │   ├── services/       # Бізнес-логіка
│   │   ├── api/           # API роути
│   │   ├── middleware/     # Middleware
│   │   ├── bot/           # Telegram бот
│   │   └── locales/        # Українська локалізація
│   ├── prisma/            # Schema та міграції
│   └── tests/             # Тести
├── frontend/               # Frontend додаток
│   ├── src/
│   │   ├── components/    # UI компоненти
│   │   ├── pages/         # Сторінки
│   │   ├── services/      # API клієнт
│   │   └── locales/       # Українська локалізація
│   └── public/           # Статичні файли
├── docker-compose.yml       # Production конфігурація
├── docker-compose.dev.yml  # Development конфігурація
└── specs/                # Технічна документація
```

## 🧪 Розробка

### Backend розробка
```bash
cd backend
npm install
npm run dev
```

### Frontend розробка
```bash
cd frontend
npm install
npm run dev
```

### Тестування
```bash
# Backend тести
cd backend
npm test

# Frontend тести
cd frontend
npm test
```

### База даних
```bash
# Генерація Prisma клієнта
npx prisma generate

# Запуск міграцій
npx prisma migrate dev

# Наповнення даними
npx prisma db seed
```

## 🔧 Конфігурація

### Environment Variables
```env
# База даних
DATABASE_URL="postgresql://user:password@localhost:5432/shanails"

# JWT
JWT_SECRET="your-secret-key"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"

# Додатково
NODE_ENV="development"
PORT=3000
```

## 📚 Документація

- [API документація](http://localhost:3000/api-docs)
- [База даних схема](./docs/database-schema.md)
- [Архітектура](./docs/architecture.md)
- [Telegram бот документація](./docs/telegram-bot.md)

## 🤝 Співпраця

1. Форкніть репозиторій
2. Створіть feature гілку (`git checkout -b feature/amazing-feature`)
3. Зробіть коміт (`git commit -m 'Add amazing feature'`)
4. Пушніть гілку (`git push origin feature/amazing-feature`)
5. Створіть Pull Request

## 📄 Ліцензія

Цей проєкт ліцензовано під MIT License - дивіться [LICENSE](LICENSE) файл для деталей.

## 🆘 Підтримка

Якщо у вас є питання або пропозиції, будь ласка, зв'яжіться з нами:

- 📧 Email: support@shanails.com
- 💬 Telegram: @shanails_support
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/shanails/issues)

---

**Зроблено з ❤️ для салонів краси України**