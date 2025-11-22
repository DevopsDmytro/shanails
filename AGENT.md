# Agent Workflow & Project Documentation

This document serves as the primary context source for AI agents working on the Shanails project.

## 🧠 Project Context
**Shanails** is a booking system for a nail salon, integrated deeply with Telegram. Users interact via a Telegram Bot which opens a WebApp (SvelteKit) for booking appointments.

### Core Workflows
1.  **User Registration:**
    *   User starts bot -> `/start` -> "Записатися" button.
    *   WebApp opens -> Checks `initData` -> Authenticates via Backend.
    *   If new user -> Redirect to Registration.
2.  **Booking:**
    *   User selects Master -> Service -> Date/Time.
    *   Booking created in DB -> Confirmation sent to User & Admin.
3.  **Admin/Client Panels (In Progress):**
    *   Admin: Manage bookings, users, masters.
    *   Client: View history, cancel/reschedule.

## 🏗 Project Structure
```text
shanails/
├── backend/                 # FastAPI Backend
│   ├── src/
│   │   ├── api/            # API Endpoints (auth, appointments, masters)
│   │   ├── core/           # Config, Security
│   │   ├── db/             # Database session
│   │   ├── models.py       # SQLAlchemy Models
│   │   └── services/       # Business Logic
│   ├── bot.py              # Telegram Bot Entrypoint
│   ├── main.py             # FastAPI Entrypoint
│   └── alembic/            # DB Migrations
├── frontend/                # SvelteKit Frontend
│   ├── src/
│   │   ├── lib/            # Shared code (api, config, telegram)
│   │   ├── routes/         # Pages (booking, auth, admin)
│   │   └── stores/         # Svelte Stores (auth)
│   └── static/
├── .github/workflows/       # CI/CD (Deploy to Production)
├── docker-compose.yml       # Local Dev & Prod Orchestration
└── README.md                # Quick Start
```

## 📜 Policies & Rules (Constitution)
1.  **Tech Stack:** Python (Backend), SvelteKit (Frontend), PostgreSQL (DB).
2.  **Containerization:** ALWAYS use Docker Compose for running services.
3.  **Localization:** ALL user-facing text MUST be in **Ukrainian**.
4.  **Testing:** Verify changes locally before pushing. Use `npm run dev` or `docker compose up`.
5.  **Git:**
    *   Commit messages: `type: Description` (e.g., `fix: Update bot text`).
    *   Branches: `feature/name` or `fix/name`.
    *   **NEVER** push directly to `main` without testing.

## 🛠 MCP Tools & Scripts Usage
### Essential MCP Tools
*   **`run_command`**: Use for git operations, file system checks, and running scripts.
    *   *Tip:* Always check `pwd` or `ls` if unsure of location.
*   **`view_file` / `replace_file_content`**: Primary tools for reading and editing code.
    *   *Tip:* Read the file first to ensure context before replacing.
*   **`postgres` (if available)**: Use for direct DB queries if needed for debugging.

### Useful Scripts
*   `docker compose up -d --build`: Rebuild and start all services.
*   `docker compose logs -f [service]`: Tail logs for backend/frontend/bot.
*   `git push`: Triggers GitHub Actions deployment (check `.github/workflows/deploy.yml`).

## 🚀 Deployment
*   **Production:** Pushing to `main` triggers deployment to `app.shapovalova.pp.ua`.
*   **Environment Variables:**
    *   `VITE_DEBUG_MODE`: `false` in Prod, `true` in Test/Dev.
    *   `VITE_TELEGRAM_BOT_USERNAME`: `sha_nails_bot` (Prod).

## 🔄 Current Status (Checkpoint)
*   **Bot:** Fixed "Tests" button -> "Записатися".
*   **Auth:** Magic link fixed, `WEBAPP_URL` points to root.
*   **Debug Mode:** Disabled in production via env vars.
*   **Next Up:** Implementing Admin & Client Panels.
