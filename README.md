# Shanails Nail Studio Booking System

A modern, containerized booking system for Shanails Nail Studio, featuring a Telegram WebApp for clients and an admin panel for staff.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 20+

### Running Locally
1. **Clone the repository**
2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```
3. **Start services:**
   ```bash
   docker compose up -d --build
   ```
   The app will be available at `http://localhost:5173`.

## 🛠 Tech Stack
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, Python-Telegram-Bot
- **Frontend:** SvelteKit, TypeScript, TailwindCSS (via app.css)
- **Infrastructure:** Docker, Nginx/Traefik, GitHub Actions

## 📂 Project Structure
- `backend/`: FastAPI application and Telegram bot logic
- `frontend/`: SvelteKit application (WebApp)
- `docker-compose.yml`: Service orchestration

## 🤖 Telegram Bot
- **Bot Username:** `@sha_nails_bot` (Production)
- **WebApp:** Accessible via the "Записатися" button or `/start` command.

## 📝 License
Private proprietary software.
