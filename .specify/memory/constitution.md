<!--
Sync Impact Report:
Version change: 2.4.0 → 3.0.0 (MAJOR: Complete technology stack overhaul from Node.js to Python/FastAPI and modern frontend)
Modified principles: All core technology principles updated to reflect actual project direction
Added sections: None (restructured existing principles)
Removed sections: None (replaced outdated technology constraints)
Templates requiring updates: ✅ plan-template.md (already aligned), ✅ spec-template.md (already aligned), ✅ tasks-template.md (already aligned)
Follow-up TODOs: None
-->

# shanails Constitution

## Core Principles

### I. PostgreSQL Database Architecture
The single source of truth MUST be a PostgreSQL database. All data persistence, relationships, and transactions MUST be handled through PostgreSQL with proper schema design and migrations using SQLAlchemy or SQLModel.

### II. Python/FastAPI Backend API
A dedicated service MUST be built using Python 3.11+ with the FastAPI framework. All business logic, API endpoints, and server-side operations MUST be implemented in this backend service for optimal performance and developer experience.

### III. Modern Frontend Framework
A Single Page Application (SPA) MUST be built using SvelteKit or Vue.js with Vite. This application serves as BOTH the public website AND the Telegram Mini App, optimized for mobile-first user experience and Telegram Mini App compatibility.

### IV. Telegram Bot Integration
A Python service using `python-telegram-bot` MUST communicate exclusively with the Backend API. The bot MUST provide clean user interactions and message cleanup to avoid chat clutter, with seamless Mini App integration.

### V. Container-First Deployment
The entire stack (Postgres, Backend, Frontend) MUST be containerized and orchestrated with a single `docker-compose.yml` file. Development and production environments MUST be managed through Docker Compose configurations with Nginx as reverse proxy.

### VI. Ukrainian Localization (L10n)
All user-facing text on all interfaces MUST be in Ukrainian. All internal code, comments, and variable names MUST remain in English. Localization MUST be implemented through dedicated locale files with proper i18n framework support.

## Development Workflow

### Git Repository Management
The project must be a fully functional Git repository from the start. All development MUST follow Git best practices with meaningful commits and proper branching strategies.

### Environment Configuration
The `docker-compose.yml` MUST support `production` and `development` environments (e.g., via `docker-compose.override.yml`) with features like hot-reloading. All secrets MUST be managed through a `.env` file.

### CI/CD Pipeline
A GitHub Actions workflow (`.github/workflows/deploy.yml`) MUST automate deployment on every push to the `main` branch. All deployments MUST be automated and reproducible.

## User Experience & Design

### Minimalistic Visual Style
The design for both the website and the bot interface MUST be minimalistic, clean, and lightweight. A simple color palette with a primary accent color MUST be used consistently.

### Responsive Design
The website and web app MUST be fully responsive and mobile-first. All interfaces MUST work seamlessly across desktop, tablet, and mobile devices.

### Clean Interface Design
The Telegram bot MUST clean up its own messages (edit or delete) to avoid chat clutter. All user interactions MUST be intuitive and uncluttered.

## Governance

This constitution supersedes all other practices and guidelines. All development decisions MUST align with these principles without exception.

### Amendment Procedure
Constitution amendments require:
1. Documentation of proposed changes with rationale
2. Version increment according to semantic versioning rules
3. Update of all dependent templates and documentation
4. Migration plan for existing code if needed

### Compliance Review
All pull requests and code reviews MUST verify compliance with constitution principles. Any deviation MUST be explicitly justified and documented. Complexity MUST be justified against these principles.

### Versioning Policy
Constitution versions follow MAJOR.MINOR.PATCH format:
- MAJOR: Backward incompatible principle changes or removals
- MINOR: New principles or substantial guidance additions
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Version**: 3.0.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-06