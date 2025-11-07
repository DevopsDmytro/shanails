# Quick Start Guide: Salon Booking System

**Date**: 2025-11-07  
**Purpose**: Development setup and integration guide

## System Overview

The Salon Booking System consists of three main components:
- **Backend API**: FastAPI service for business logic and data management
- **Frontend SPA**: SvelteKit application for web and Telegram Mini App
- **Telegram Bot**: Python bot for user interaction and notifications

## Prerequisites

### Development Environment
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Git
- PostgreSQL client tools (optional)

### External Services
- Telegram Bot Token (from @BotFather)
- Domain name for production deployment
- SSL certificates (for HTTPS)

## Quick Setup

### 1. Clone and Initialize
```bash
git clone <repository-url>
cd shanails
git checkout 006-spec-process
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://salon:password@localhost:5432/salon_db

# Backend
SECRET_KEY=your-secret-key-here
DEBUG=true

# Telegram Bot
BOT_TOKEN=your-telegram-bot-token
MINI_APP_URL=https://your-domain.com/mini-app

# Frontend
VITE_API_BASE_URL=http://localhost:8000/v1
VITE_MINI_APP_MODE=false

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 3. Start Development Environment
```bash
# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python -m app.scripts.create_admin
```

### 4. Verify Setup
```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
open http://localhost:5173

# Check database
docker-compose exec db psql -U salon -d salon_db -c "\dt"
```

## Development Workflow

### Backend Development

#### Project Structure
```
backend/
├── src/
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── api/            # API endpoints
│   ├── core/           # Configuration
│   └── main.py         # FastAPI app
├── tests/              # Test suite
├── alembic/            # Database migrations
└── requirements.txt
```

#### Common Commands
```bash
# Enter backend container
docker-compose exec backend bash

# Run development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

#### API Development
```python
# Example endpoint in src/api/endpoints/bookings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("/")
async def create_booking(
    booking: CreateBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Implementation here
    pass
```

### Frontend Development

#### Project Structure
```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── services/      # API calls
│   ├── locales/       # Translations
│   └── app.html       # Main template
├── tests/             # Test suite
├── package.json
└── vite.config.js
```

#### Common Commands
```bash
# Enter frontend container
docker-compose exec frontend bash

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Component Development
```svelte
<!-- Example component in src/components/BookingCalendar.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getMasterAvailability } from '$lib/services/api';
  
  export let masterId: number;
  export let selectedDate: Date;
  
  let availableSlots: string[] = [];
  
  onMount(async () => {
    availableSlots = await getMasterAvailability(masterId, selectedDate);
  });
</script>

<div class="calendar">
  <!-- Calendar implementation -->
</div>
```

### Telegram Bot Development

#### Project Structure
```
bot/
├── src/
│   ├── handlers/      # Command handlers
│   ├── services/      # Business logic
│   ├── keyboards/     # Reply keyboards
│   └── bot.py         # Main bot file
├── locales/           # Message templates
└── requirements.txt
```

#### Common Commands
```bash
# Enter bot container
docker-compose exec bot bash

# Run bot
python -m src.bot

# Run tests
pytest
```

#### Handler Development
```python
# Example handler in src/handlers/booking.py
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

async def start_booking(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("📅 Записатися", web_app=WebAppInfo(url=MINI_APP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Ласкаво просимо до салону краси!",
        reply_markup=reply_markup
    )
```

## Database Management

### Migration Workflow
```bash
# 1. Make model changes in src/models/
# 2. Generate migration
docker-compose exec backend alembic revision --autogenerate -m "Add new table"

# 3. Review generated migration
# 4. Apply migration
docker-compose exec backend alembic upgrade head

# 5. Verify changes
docker-compose exec db psql -U salon -d salon_db -c "\d new_table"
```

### Common Database Operations
```sql
-- View all tables
\dt

-- View table structure
\d appointments

-- Check indexes
\di

-- Sample queries
SELECT * FROM masters WHERE is_active = true;
SELECT * FROM appointments WHERE start_time > NOW();
```

## Testing

### Backend Testing
```bash
# Run all tests
docker-compose exec backend pytest

# Run specific test file
docker-compose exec backend pytest tests/test_bookings.py

# Run with coverage
docker-compose exec backend pytest --cov=src

# Run integration tests
docker-compose exec backend pytest tests/integration/
```

### Frontend Testing
```bash
# Run unit tests
docker-compose exec frontend npm run test

# Run E2E tests
docker-compose exec frontend npm run test:e2e

# Run with coverage
docker-compose exec frontend npm run test:coverage
```

### Bot Testing
```bash
# Run bot tests
docker-compose exec bot pytest

# Test with mock Telegram API
docker-compose exec bot pytest tests/test_handlers.py -v
```

## Telegram Integration

### Bot Setup
1. Create bot with @BotFather
2. Set bot token in environment
3. Configure webhook (production) or use polling (development)
4. Set up Mini App domain in BotFather

### Mini App Integration
```javascript
// Frontend Mini App initialization
import { initMiniApp } from '$lib/services/telegram';

if (window.Telegram?.WebApp) {
  const miniApp = initMiniApp(window.Telegram.WebApp);
  miniApp.ready();
  miniApp.expand();
}
```

### Webhook Configuration (Production)
```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/webhook" \
  -d "secret_token=your-webhook-secret"
```

## Deployment

### Production Build
```bash
# Build all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python -m app.scripts.create_admin
```

### Environment-Specific Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - DEBUG=false
      - DATABASE_URL=${PROD_DATABASE_URL}
    restart: unless-stopped
    
  frontend:
    environment:
      - VITE_API_BASE_URL=${PROD_API_URL}
      - VITE_MINI_APP_MODE=true
    restart: unless-stopped
```

### SSL Configuration
```nginx
# nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    location /api/ {
        proxy_pass http://backend:8000/;
    }
    
    location / {
        proxy_pass http://frontend:5173/;
    }
    
    location /webhook {
        proxy_pass http://bot:8000/;
    }
}
```

## Monitoring and Debugging

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f bot

# View database logs
docker-compose logs -f db
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:5173/

# Database health
docker-compose exec db pg_isready
```

### Performance Monitoring
```bash
# Database performance
docker-compose exec db psql -U salon -d salon_db -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;"

# Backend performance
curl http://localhost:8000/metrics
```

## Common Issues and Solutions

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps db

# Restart database
docker-compose restart db

# Check connection string
echo $DATABASE_URL
```

### Bot Not Responding
```bash
# Check bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Reset webhook if needed
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### Frontend Build Issues
```bash
# Clear node modules
docker-compose exec frontend rm -rf node_modules package-lock.json
docker-compose exec frontend npm install

# Clear build cache
docker-compose exec frontend rm -rf .svelte-kit
```

## Development Tips

### Code Quality
```bash
# Backend linting
docker-compose exec backend flake8 src/
docker-compose exec backend black src/
docker-compose exec backend isort src/

# Frontend linting
docker-compose exec frontend npm run lint
docker-compose exec frontend npm run format
```

### Database Seeding
```bash
# Seed sample data
docker-compose exec backend python -m app.scripts.seed_data

# Create test masters and services
docker-compose exec backend python -m app.scripts.create_sample_data
```

### API Documentation
- Visit http://localhost:8000/docs for interactive API docs
- Visit http://localhost:8000/redoc for alternative documentation

## Next Steps

1. **Complete Phase 1**: Implement core booking functionality
2. **Add Features**: Reviews, notifications, advanced scheduling
3. **Optimize Performance**: Caching, database optimization
4. **Enhance Security**: Rate limiting, input validation
5. **Deploy to Production**: SSL, monitoring, backup strategies

This guide provides the foundation for developing and deploying the salon booking system. Follow the step-by-step instructions to get your development environment running quickly.