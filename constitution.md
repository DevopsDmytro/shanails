# Constitution for "shanails" Project - Version 2.3 (Full-Featured Mandate)

This document establishes the mandatory, non-negotiable principles. The AI agent MUST adhere to these rules without deviation. Any reference to Python, n8n as a primary backend, or Flask is strictly forbidden.

**1. Core Architecture (Mandatory):**
    *   **Database:** The single source of truth **must be a PostgreSQL database.**
    *   **Backend API:** A dedicated service **must be built using Node.js and the Express.js framework.**
    *   **Frontend (Single Source):** A single, static web application **must be built using Vite with vanilla JavaScript, HTML, and CSS.** This application will serve as BOTH the public website AND the Telegram Mini App.
    *   **Telegram Bot:** A Node.js service using `node-telegram-bot-api`, communicating exclusively with the Backend API.
    *   **Containerization:** The entire stack (Postgres, Backend, Frontend) **must be containerized and orchestrated with a single `docker-compose.yml` file.**

**2. DevOps & Environments (Mandatory):**
    *   **Git Repository:** The project must be a fully functional Git repository from the start.
    *   **Environments:** The `docker-compose.yml` must support `production` and `development` environments (e.g., via `docker-compose.override.yml`) with features like hot-reloading.
    *   **CI/CD:** A GitHub Actions workflow (`.github/workflows/deploy.yml`) must automate deployment on every push to the `main` branch.
    *   **Configuration:** All secrets **must be managed through a `.env` file.**

**3. User Experience (UX) & Design (Mandatory):**
    *   **Visual Style:** The design for both the website and the bot interface must be **minimalistic, clean, and lightweight.** Use a simple color palette with a primary accent color.
    *   **Clean Interface:** The Telegram bot **must** clean up its own messages (edit or delete) to avoid chat clutter.
    *   **Responsiveness:** The website and web app must be fully responsive and mobile-first.

**4. Localization (L10n) (Mandatory):**
    *   **Language:** All user-facing text on all interfaces **must be in Ukrainian.**
    *   **Code Language:** All internal code, comments, and variable names must remain in English.
