---

description: "Task list for Complete Nail Salon Booking System implementation"
---

# Tasks: Complete Nail Salon Booking System

**Input**: Design documents from `/specs/005-booking-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow web application structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan
- [X] T002 Initialize Node.js project with Express.js dependencies in backend/package.json
- [X] T003 [P] Initialize Vite project with vanilla JS in frontend/package.json
- [X] T004 [P] Configure ESLint and Prettier for code formatting
- [X] T005 [P] Set up environment configuration with .env.example
- [X] T006 Create Docker configuration files (docker-compose.yml, docker-compose.dev.yml)
- [X] T007 [P] Set up Git repository with .gitignore and README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Setup PostgreSQL database with Prisma ORM in backend/prisma/schema.prisma
- [X] T009 [P] Implement JWT authentication middleware in backend/src/middleware/auth.js
- [X] T010 [P] Setup Express.js API routing structure in backend/src/routes/
- [X] T011 Create base User, Service, MasterProfile, Appointment models in backend/prisma/schema.prisma
- [X] T012 [P] Configure error handling and logging infrastructure in backend/src/middleware/errorHandler.js
- [X] T013 [P] Setup environment configuration management in backend/src/config/database.js
- [X] T014 [P] Create Ukrainian localization files in backend/src/locales/uk.js and frontend/src/locales/uk.js
- [X] T015 [P] Setup Telegram bot integration in backend/src/bot/index.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Client Booking Flow (Priority: P1) 🎯 MVP

**Goal**: Enable customers to browse services, select masters, choose date/time, and book appointments through Telegram bot or web interface

**Independent Test**: Can be fully tested by a user completing a full booking cycle from service selection to confirmation, receiving appointment details via Telegram

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create Service model with price, duration, category in backend/prisma/schema.prisma
- [ ] T017 [P] [US1] Create MasterProfile model with schedule in backend/prisma/schema.prisma
- [ ] T018 [P] [US1] Create Appointment model with booking logic in backend/prisma/schema.prisma
- [ ] T019 [US1] Implement ServiceService in backend/src/services/serviceService.js (depends on T016)
- [ ] T020 [US1] Implement MasterService in backend/src/services/masterService.js (depends on T017)
- [ ] T021 [US1] Implement BookingService in backend/src/services/bookingService.js (depends on T018, T019, T020)
- [ ] T022 [US1] Create GET /api/services endpoint in backend/src/routes/services.js
- [ ] T023 [US1] Create GET /api/masters endpoint in backend/src/routes/masters.js
- [ ] T024 [US1] Create GET /api/masters/:id/availability endpoint in backend/src/routes/masters.js
- [ ] T025 [US1] Create POST /api/appointments endpoint in backend/src/routes/appointments.js
- [ ] T026 [US1] Implement Telegram bot booking flow in backend/src/bot/booking.js
- [ ] T027 [US1] Create frontend service browser component in frontend/src/components/ServiceBrowser.js
- [ ] T028 [US1] Create frontend master selection component in frontend/src/components/MasterSelector.js
- [ ] T029 [US1] Create frontend date/time picker component in frontend/src/components/DateTimePicker.js
- [ ] T030 [US1] Create frontend booking confirmation component in frontend/src/components/BookingConfirmation.js
- [ ] T031 [US1] Create frontend booking page in frontend/src/pages/booking.js
- [ ] T032 [US1] Integrate Telegram Mini App SDK in frontend/src/utils/telegram.js
- [ ] T033 [US1] Add booking validation and error handling in backend/src/middleware/bookingValidation.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Admin Appointment Management (Priority: P1)

**Goal**: Enable administrators to view, create, edit, and delete appointments through protected web interface

**Independent Test**: Can be fully tested by an admin logging in, viewing appointment list, creating a new appointment, and modifying an existing one

### Implementation for User Story 2

- [ ] T034 [P] [US2] Extend User model with admin role validation in backend/prisma/schema.prisma
- [ ] T035 [US2] Implement AdminService in backend/src/services/adminService.js
- [ ] T036 [US2] Create POST /api/auth/login endpoint in backend/src/routes/auth.js
- [ ] T037 [US2] Create GET /api/appointments endpoint with filtering in backend/src/routes/appointments.js
- [ ] T038 [US2] Create PUT /api/appointments/:id endpoint in backend/src/routes/appointments.js
- [ ] T039 [US2] Create DELETE /api/appointments/:id endpoint in backend/src/routes/appointments.js
- [ ] T040 [US2] Implement appointment status management (no-show tracking) in backend/src/services/appointmentService.js
- [ ] T041 [US2] Create admin authentication middleware in backend/src/middleware/adminAuth.js
- [ ] T042 [US2] Create frontend admin login component in frontend/src/components/AdminLogin.js
- [ ] T043 [US2] Create frontend appointment list component in frontend/src/components/AppointmentList.js
- [ ] T044 [US2] Create frontend appointment form component in frontend/src/components/AppointmentForm.js
- [ ] T045 [US2] Create frontend admin dashboard page in frontend/src/pages/admin.js
- [ ] T046 [US2] Add admin route protection in frontend/src/utils/auth.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Master and Service Management (Priority: P2)

**Goal**: Enable administrators to create and edit master profiles, define work schedules, and manage service categories with pricing

**Independent Test**: Can be fully tested by an admin creating a new master profile, defining their weekly schedule, and adding services with prices

### Implementation for User Story 3

- [ ] T047 [P] [US3] Create Schedule model for master availability in backend/prisma/schema.prisma
- [ ] T048 [US3] Implement MasterManagementService in backend/src/services/masterManagementService.js
- [ ] T049 [US3] Implement ServiceManagementService in backend/src/services/serviceManagementService.js
- [ ] T050 [US3] Create POST /api/admin/masters endpoint in backend/src/routes/admin/masters.js
- [ ] T051 [US3] Create PUT /api/admin/masters/:id endpoint in backend/src/routes/admin/masters.js
- [ ] T052 [US3] Create POST /api/admin/services endpoint in backend/src/routes/admin/services.js
- [ ] T053 [US3] Create PUT /api/admin/services/:id endpoint in backend/src/routes/admin/services.js
- [ ] T054 [US3] Create DELETE /api/admin/services/:id endpoint in backend/src/routes/admin/services.js
- [ ] T055 [US3] Create POST /api/admin/masters/:id/schedule endpoint in backend/src/routes/admin/masters.js
- [ ] T056 [US3] Create frontend master management component in frontend/src/components/MasterManagement.js
- [ ] T057 [US3] Create frontend service management component in frontend/src/components/ServiceManagement.js
- [ ] T058 [US3] Create frontend schedule editor component in frontend/src/components/ScheduleEditor.js
- [ ] T059 [US3] Add master and service management pages to frontend admin section

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Automated Reminders and Feedback (Priority: P2)

**Goal**: Automatically send appointment reminders 24 hours in advance and request feedback 24 hours after appointments

**Independent Test**: Can be fully tested by scheduling appointments and verifying that reminder and feedback messages are sent at the correct times

### Implementation for User Story 4

- [ ] T060 [P] [US4] Create Review model for customer feedback in backend/prisma/schema.prisma
- [ ] T061 [US4] Implement ReminderService in backend/src/services/reminderService.js
- [ ] T062 [US4] Implement FeedbackService in backend/src/services/feedbackService.js
- [ ] T063 [US4] Setup node-cron for scheduled tasks in backend/src/jobs/scheduler.js
- [ ] T064 [US4] Create POST /api/appointments/:id/review endpoint in backend/src/routes/appointments.js
- [ ] T065 [US4] Implement reminder message templates in backend/src/templates/reminders.js
- [ ] T066 [US4] Implement feedback request templates in backend/src/templates/feedback.js
- [ ] T067 [US4] Add reminder and feedback logic to Telegram bot in backend/src/bot/reminders.js
- [ ] T068 [US4] Create frontend feedback component in frontend/src/components/FeedbackForm.js
- [ ] T069 [US4] Add feedback display to appointment details in frontend

**Checkpoint**: Automated messaging system should be fully functional

---

## Phase 7: User Story 5 - Analytics Dashboard (Priority: P3)

**Goal**: Enable administrators to view key business metrics including bookings per month, bookings per master, and service popularity

**Independent Test**: Can be fully tested by an admin accessing the dashboard and verifying that all metrics display correctly with accurate data

### Implementation for User Story 5

- [ ] T070 [P] [US5] Implement AnalyticsService in backend/src/services/analyticsService.js
- [ ] T071 [US5] Create GET /api/admin/analytics endpoint in backend/src/routes/admin/analytics.js
- [ ] T072 [US5] Implement booking aggregation queries in backend/src/services/analyticsService.js
- [ ] T073 [US5] Implement master performance analytics in backend/src/services/analyticsService.js
- [ ] T074 [US5] Implement service popularity analytics in backend/src/services/analyticsService.js
- [ ] T075 [US5] Create frontend analytics dashboard component in frontend/src/components/AnalyticsDashboard.js
- [ ] T076 [US5] Create frontend chart components in frontend/src/components/charts/
- [ ] T077 [US5] Add analytics page to frontend admin section

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T078 [P] Documentation updates in docs/
- [ ] T079 Code cleanup and refactoring across all services
- [ ] T080 Performance optimization across all stories
- [ ] T081 [P] Additional unit tests in backend/tests/unit/
- [ ] T082 [P] Integration tests in backend/tests/integration/
- [ ] T083 Security hardening across all endpoints
- [ ] T084 Run quickstart.md validation
- [ ] T085 [P] Add comprehensive error logging and monitoring
- [ ] T086 [P] Implement rate limiting and security headers
- [ ] T087 Final testing and deployment preparation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for appointment structure
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on data from US1, US2, US3

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Service model with price, duration, category in backend/prisma/schema.prisma"
Task: "Create MasterProfile model with schedule in backend/prisma/schema.prisma"
Task: "Create Appointment model with booking logic in backend/prisma/schema.prisma"

# Launch all services for User Story 1 together:
Task: "Implement ServiceService in backend/src/services/serviceService.js"
Task: "Implement MasterService in backend/src/services/masterService.js"
Task: "Implement BookingService in backend/src/services/bookingService.js"

# Launch all frontend components for User Story 1 together:
Task: "Create frontend service browser component in frontend/src/components/ServiceBrowser.js"
Task: "Create frontend master selection component in frontend/src/components/MasterSelector.js"
Task: "Create frontend date/time picker component in frontend/src/components/DateTimePicker.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently
4. Developer D: User Story 4 (after US1)
5. Developer E: User Story 5 (after data collection)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests were requested)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Task Summary

**Total Tasks**: 87
**Tasks per User Story**:
- User Story 1: 18 tasks
- User Story 2: 13 tasks  
- User Story 3: 13 tasks
- User Story 4: 10 tasks
- User Story 5: 8 tasks
- Setup: 7 tasks
- Foundational: 8 tasks
- Polish: 10 tasks

**Parallel Opportunities**: 45 tasks marked as parallelizable
**Independent Test Criteria**: Each user story has clear independent test definition
**Suggested MVP Scope**: Complete Phase 1 + Phase 2 + Phase 3 (User Story 1 only)