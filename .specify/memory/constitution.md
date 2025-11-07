<!--
Sync Impact Report:
Version change: 2.3 → 2.4.0 (MINOR: Added localization principle and expanded governance)
Modified principles: None (all retained with clarified wording)
Added sections: Localization (L10n) as Principle 6
Removed sections: None
Templates requiring updates: ✅ plan-template.md (already aligned), ✅ spec-template.md (already aligned), ✅ tasks-template.md (already aligned)
Follow-up TODOs: None
-->

# shanails Constitution

## Core Principles

### I. PostgreSQL Database Architecture
The single source of truth MUST be a PostgreSQL database. All data persistence, relationships, and transactions MUST be handled through PostgreSQL with proper schema design and migrations.

### II. Node.js/Express Backend API
A dedicated service MUST be built using Node.js and the Express.js framework. All business logic, API endpoints, and server-side operations MUST be implemented in this backend service.

### III. Vite Vanilla JS Frontend
A single, static web application MUST be built using Vite with vanilla JavaScript, HTML, and CSS. This application serves as BOTH the public website AND the Telegram Mini App. No frontend frameworks are permitted.

### IV. Telegram Bot Integration
A Node.js service using `node-telegram-bot-api` MUST communicate exclusively with the Backend API. The bot MUST provide clean user interactions and message cleanup to avoid chat clutter.

### V. Container-First Deployment
The entire stack (Postgres, Backend, Frontend) MUST be containerized and orchestrated with a single `docker-compose.yml` file. Development and production environments MUST be managed through Docker Compose configurations.

### VI. Ukrainian Localization (L10n)
All user-facing text on all interfaces MUST be in Ukrainian. All internal code, comments, and variable names MUST remain in English. Localization MUST be implemented through dedicated locale files.

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

**Version**: 2.4.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-04