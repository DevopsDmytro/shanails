# Technical Implementation Plan for "shanails" - v2.3

This is a strict technical plan. The AI agent MUST build the application using the specified file structure and technologies. **NO PYTHON.**

**1. Root Directory Structure:**
*   `/backend`, `/frontend`, `docker-compose.yml`, `.env.example`, `README.md`, `.github/workflows/deploy.yml`.

**2. Localization:**
*   **Backend/Bot:** Create `backend/src/locales/uk.js` to store all Ukrainian strings.
*   **Frontend:** Create `frontend/src/locales/uk.js` for all website text.

**3. `backend` Service (Node.js/Express):**
*   **Location:** `/backend`
*   **Framework:** **Node.js/Express.js**.
*   **Database (`Prisma`):**
    *   Initialize Prisma with the `postgresql` provider.
    *   The `schema.prisma` **must** define models for:
        *   `User` (with `id`, `telegramId`, `name`, `phone`, `role` enum, `isBlocked` boolean, `isUnreliable` boolean, `notes` string).
        *   `Service` (with `id`, `name`, `price`, `duration`, `category`).
        *   `MasterProfile` (with relation to `User`).
        *   `Schedule` (weekly availability for each master).
        *   `Appointment` (with relations and status enum).
        *   `Review` (with `rating` and relation to `Appointment`).
*   **API & Authorization:** Create an Express middleware `checkRole('ADMIN')` that verifies the JWT to protect admin-only API routes. Implement all necessary RESTful API endpoints for client and admin functionality.
*   **Bot Logic (`node-telegram-bot-api`):**
    *   Runs in this same service.
    *   The "Записатися" button **must** be an inline button with a `web_app` URL pointing to the frontend service.
    *   Implement a cron job (e.g., using `node-cron`) to handle appointment reminders and feedback requests.

**4. `frontend` Service (Vite/Nginx):**
*   **Location:** `/frontend`
*   **Framework:** **Vite** with vanilla JS.
*   **Telegram Mini App SDK:** The main `index.html` **must** include the Telegram Web App SDK script: `<script src="https://telegram.org/js/telegram-web-app.js"></script>`. The JavaScript code must use `window.Telegram.WebApp` to adapt the UI when running inside Telegram (e.g., using Telegram's theme colors and main button).
*   **Nginx Proxy:** The Nginx config **must** proxy all `/api/` requests to the `backend` service.

**5. `docker-compose.yml` (Production & Development):**
*   Define three services: `postgres`, `backend`, `frontend`.
*   Use a named volume `postgres_data` for database persistence.
*   The `frontend` service exposes port `80`.
*   Implement a `dev` override file with hot-reloading for both `backend` and `frontend`.

**6. `README.md` & `.github/workflows/deploy.yml`:**
*   Generate these files. The `README.md` must detail how to run the project for development and production using Docker Compose. The `deploy.yml` must contain the correct steps for deployment on a self-hosted runner.
