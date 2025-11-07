# Quick Start Guide: Nail Salon Booking System

**Version**: 1.0.0  
**Updated**: 2025-11-04  
**Target**: Developers and system administrators

## Prerequisites

### System Requirements
- **Node.js**: 18.x LTS or higher
- **PostgreSQL**: 14.x or higher
- **Docker**: 20.x or higher (for containerized deployment)
- **Git**: For version control

### Development Tools
- **VS Code** or preferred code editor
- **Postman** or similar API testing tool
- **pgAdmin** or PostgreSQL client
- **Redis** (optional, for production caching)

## Quick Setup (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd shanails

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your settings:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shanails"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup
```bash
# Start PostgreSQL (using Docker)
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=shanails -p 5432:5432 -d postgres:14

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Start Development Server
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend    # Backend API on port 3000
npm run dev:frontend   # Frontend on port 5173
npm run dev:bot        # Telegram bot
```

## Development Workflow

### 1. Backend Development
```bash
# Run backend in development mode
cd backend
npm run dev

# Run tests
npm test

# Run with database reset
npm run dev:reset
```

### 2. Frontend Development
```bash
# Run frontend in development mode
cd frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Telegram Bot Development
```bash
# Run bot in development mode
cd backend
npm run dev:bot

# Test bot commands
# Send /start to your bot in Telegram
```

## Docker Development

### Development Environment
```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment
```bash
# Build and start production containers
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=2

# View status
docker-compose ps
```

## Database Management

### Migrations
```bash
# Create new migration
npm run db:migration:create --name add_new_table

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# View migration status
npm run db:migrate:status
```

### Seeding Data
```bash
# Seed initial data (services, masters, etc.)
npm run db:seed

# Seed development data
npm run db:seed:dev

# Reset and reseed
npm run db:seed:reset
```

### Database Access
```bash
# Open database shell
npm run db:shell

# View database schema
npm run db:schema

# Backup database
npm run db:backup
```

## API Testing

### Using Postman
1. Import Postman collection from `docs/postman-collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:3000/v1`
   - `token`: Get from login endpoint
3. Test endpoints in order:
   - Authentication → Services → Masters → Appointments

### Using Curl
```bash
# Health check
curl http://localhost:3000/health

# Get services
curl http://localhost:3000/v1/services

# Admin login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Frontend Development

### Component Structure
```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/         # Button, Input, Modal, etc.
│   ├── booking/        # Booking flow components
│   └── admin/          # Admin panel components
├── pages/              # Page-specific components
│   ├── home/           # Landing page
│   ├── booking/        # Booking pages
│   └── admin/          # Admin pages
├── services/           # API communication
├── locales/            # Ukrainian translations
└── styles/             # CSS styles
```

### Localization
```javascript
// Using Ukrainian translations
import { t } from './locales/uk.js';

const message = t('booking.confirmation'); // "Підтвердити запис"
```

### Telegram Mini App Integration
```javascript
// Check if running in Telegram
if (window.Telegram?.WebApp) {
  const webApp = window.Telegram.WebApp;
  webApp.ready();
  webApp.expand();
  
  // Use Telegram theme colors
  document.documentElement.style.setProperty(
    '--tg-theme-bg-color', 
    webApp.themeParams.bg_color
  );
}
```

## Testing

### Backend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- appointments.test.js

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Frontend Tests
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Environment Setup
1. **Production Environment Variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@prod-db:5432/shanails
   JWT_SECRET=production-secret-key
   TELEGRAM_BOT_TOKEN=production-bot-token
   ```

2. **Database Setup**:
   ```bash
   # Run production migrations
   npm run db:migrate:prod
   
   # Seed production data
   npm run db:seed:prod
   ```

### Docker Deployment
```bash
# Build production images
docker-compose build

# Deploy to production
docker-compose -f docker-compose.yml up -d

# Check deployment status
docker-compose ps
docker-compose logs -f
```

### Manual Deployment
```bash
# Install production dependencies
npm ci --production

# Build frontend
cd frontend && npm run build

# Start backend
cd backend && npm start

# Start bot
cd backend && npm run bot:prod
```

## Monitoring and Debugging

### Logs
```bash
# View application logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f bot

# View error logs only
docker-compose logs backend | grep ERROR
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Bot health
curl http://localhost:3000/health/bot
```

### Performance Monitoring
```bash
# View API response times
curl -w "@curl-format.txt" http://localhost:3000/v1/services

# Database query performance
npm run db:analyze

# Memory usage
docker stats
```

## Common Issues and Solutions

### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check connection string
echo $DATABASE_URL
```

### Telegram Bot Issues
```bash
# Verify bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check bot webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Reset webhook
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook
```

### Frontend Build Issues
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## Development Best Practices

### Code Organization
- Follow the established folder structure
- Use TypeScript for better type safety
- Implement proper error handling
- Write unit tests for business logic

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "feat: add new booking feature"

# Push and create PR
git push origin feature/new-feature
```

### Environment Management
- Use different `.env` files for each environment
- Never commit secrets to version control
- Use environment-specific configurations

## Getting Help

### Documentation
- API Documentation: `http://localhost:3000/api-docs`
- Database Schema: Check `docs/database-schema.md`
- Component Documentation: Check `docs/components.md`

### Support
- Create an issue in the project repository
- Check existing issues for solutions
- Join the development team chat for real-time help

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Next Steps

1. **Complete Setup**: Follow the quick setup guide
2. **Explore Features**: Test the booking flow
3. **Review Code**: Understand the architecture
4. **Start Development**: Begin working on your feature
5. **Run Tests**: Ensure everything works correctly

For detailed information on specific features, check the respective documentation files in the `docs/` directory.