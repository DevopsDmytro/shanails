Now that the implementation is complete, your final task is to generate comprehensive documentation for the "shanails" project. Create a new root-level file named `PROJECT_DOCS.md`.

This file must be written in Ukrainian and should be structured for a new developer who needs to understand, run, and deploy the project. It must include the following sections:

## 1. Огляд Архітектури

*   Короткий опис трьох основних сервісів: `postgres`, `backend`, `frontend`.
*   Пояснення, як вони взаємодіють між собою (Frontend -> Backend API -> Postgres).
*   Опис ролі Telegram Mini App і як він використовує той самий Frontend.

## 2. Локальний Запуск (Development)

*   Покрокова інструкція для запуску проєкту на локальній машині.
*   **Крок 1:** Вимоги до системи (встановлені Docker та Docker Compose).
*   **Крок 2:** Створення та налаштування файлу `.env` з `.env.example`. Детальний опис кожної змінної (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `JWT_SECRET` і т.д.).
*   **Крок 3:** Команда для першого запуску, включаючи створення бази даних та застосування міграцій (`npx prisma migrate dev`).
*   **Крок 4:** Команда для запуску в режимі розробки з hot-reloading (`docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build`).
*   **Крок 5:** Пояснення, за якими адресами будуть доступні сервіси (Frontend на `http://localhost:8080`, Backend API на `http://localhost:3000`).

## 3. Розгортання (Deployment) на Сервер

*   Інструкції для деплою на "чистий" сервер.
*   **Крок 1:** Клонування репозиторію.
*   **Крок 2:** Створення та налаштування `.env` файлу вже для production (з реальним доменом, якщо потрібно).
*   **Крок 3:** Інструкції з налаштування self-hosted GitHub Actions runner, якщо він ще не налаштований.
*   **Крок 4:** Пояснення, що CI/CD процес автоматизований і деплой відбудеться автоматично після `git push` в гілку `main`. Опис того, що робить воркфлоу `.github/workflows/deploy.yml`.

## 4. Структура Проєкту

*   Опис основних директорій (`/backend`, `/frontend`).
*   Пояснення призначення ключових файлів та папок усередині `backend` (напр., `prisma/schema.prisma`, `src/api/`, `src/bot/`, `src/locales/`).
*   Пояснення призначення ключових файлів усередині `frontend` (напр., `main.js`, `style.css`, `locales/`).

## 5. Огляд API

*   Стислий опис основних ендпоінтів API, згрупованих за призначенням (Аутентифікація, Робота з записами, Адмін-ендпоінти).
*   Приклади `curl` запитів для кількох ключових ендпоінтів.
