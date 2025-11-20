# Shanails Project Makefile
# Simplifies common development tasks

.PHONY: help dev-up dev-down test-up test-down prod-check seed backup stats logs clean

# Default target
help:
	@echo "Shanails Project - Available Commands"
	@echo ""
	@echo "Local Development (Test Environment):"
	@echo "  make dev-up          Start test environment"
	@echo "  make dev-down        Stop test environment"
	@echo "  make dev-rebuild     Rebuild and restart test environment"
	@echo ""
	@echo "Database Management:"
	@echo "  make seed            Seed database with sample data"
	@echo "  make backup          Create database backup"
	@echo "  make stats           Show database statistics"
	@echo ""
	@echo "Monitoring & Logs:"
	@echo "  make logs            Show all service logs"
	@echo "  make logs-backend    Show backend logs"
	@echo "  make logs-frontend   Show frontend logs"
	@echo "  make logs-bot        Show bot logs"
	@echo "  make logs-db         Show database logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod-deploy     Trigger production deployment"
	@echo "  make prod-check      Check production service status"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean           Remove containers and volumes"
	@echo "  make clean-volumes   Remove volumes (CAUTION: deletes data)"

# Development environment (test)
dev-up:
	@echo "🚀 Starting Test Environment..."
	docker compose --env-file .env.test -f docker-compose.test.yml up -d
	@echo "✅ Test environment started at https://test.shapovalova.pp.ua"

dev-down:
	@echo "🛑 Stopping Test Environment..."
	docker compose --env-file .env.test -f docker-compose.test.yml down

dev-rebuild:
	@echo "🔄 Rebuilding Test Environment..."
	docker compose --env-file .env.test -f docker-compose.test.yml up -d --build

# Database operations
seed:
	@./scripts/db-manage.sh seed

backup:
	@./scripts/db-manage.sh backup

stats:
	@./scripts/db-manage.sh stats

# Logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-bot:
	docker compose logs -f bot

logs-db:
	docker compose logs -f db

logs-traefik:
	docker compose logs -f traefik

# Production deployment
prod-deploy:
	@echo "🚀 Triggering production deployment..."
	@echo "dummy change to trigger deploy" > .trigger-deploy
	git add .trigger-deploy
	git commit -m "chore: trigger production deployment"
	git push

prod-check:
	@echo "📊 Checking production services status..."
	@curl -s https://app.shapovalova.pp.ua/api/v1/health || echo "❌ Production API is down"

# Cleanup
clean:
	@echo "🧹 Cleaning up containers..."
	docker compose down

clean-volumes:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v
	@echo "✅ Volumes removed"

# Health check
health:
	@echo "🏥 Health Check:"
	@docker ps --filter "name=shanails" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
