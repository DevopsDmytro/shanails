# Feature Specification: Complete Nail Salon Booking System

**Feature Branch**: `005-booking-system`  
**Created**: 2025-11-04  
**Status**: Draft  
**Input**: User description: "Complete nail salon booking system with Telegram integration and admin panel"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Booking Flow (Priority: P1)

A client can browse services, select a master, choose date/time, and book an appointment through Telegram bot or web interface. The system shows live pricing and prevents double-booking.

**Why this priority**: This is the core functionality that delivers immediate value to customers and generates revenue for the business.

**Independent Test**: Can be fully tested by a user completing a full booking cycle from service selection to confirmation, receiving appointment details via Telegram.

**Acceptance Scenarios**:

1. **Given** a user opens the Telegram bot, **When** they tap "Записатися", **Then** the booking interface opens with available masters and services
2. **Given** a user selects services and master, **When** they choose a date and time slot, **Then** they see total price and can confirm the booking
3. **Given** a user confirms booking, **When** the booking is saved, **Then** they receive a confirmation message with all appointment details

---

### User Story 2 - Admin Appointment Management (Priority: P1)

An administrator can view, create, edit, and delete appointments through a protected web interface, including marking clients as no-shows and managing appointment status.

**Why this priority**: Essential for daily business operations and maintaining accurate appointment records.

**Independent Test**: Can be fully tested by an admin logging in, viewing the appointment list, creating a new appointment, and modifying an existing one.

**Acceptance Scenarios**:

1. **Given** an admin logs into the admin panel, **When** they navigate to appointments, **Then** they see a filterable list of all appointments
2. **Given** an admin views an appointment, **When** they mark a client as no-show, **Then** the appointment status updates and client reliability is affected
3. **Given** an admin creates a new appointment, **When** they save it, **Then** the appointment appears in the system and client receives notification

---

### User Story 3 - Master and Service Management (Priority: P2)

An administrator can create and edit master profiles, define work schedules, and manage service categories with pricing and duration.

**Why this priority**: Required for maintaining accurate service offerings and availability, but can be initially set up by administrators before going live.

**Independent Test**: Can be fully tested by an admin creating a new master profile, defining their weekly schedule, and adding services with prices.

**Acceptance Scenarios**:

1. **Given** an admin accesses master management, **When** they create a new master profile, **Then** the master appears in the booking system with their defined schedule
2. **Given** an admin manages services, **When** they add a new service with price and duration, **Then** the service appears in the booking flow with correct pricing
3. **Given** an admin edits a master's schedule, **When** they save changes, **Then** available time slots update accordingly for future bookings

---

### User Story 4 - Automated Reminders and Feedback (Priority: P2)

The system automatically sends appointment reminders 24 hours in advance and requests feedback 24 hours after appointments via Telegram bot.

**Why this priority**: Improves customer experience and reduces no-shows, but the core booking functionality works without it.

**Independent Test**: Can be fully tested by scheduling appointments and verifying that reminder and feedback messages are sent at the correct times.

**Acceptance Scenarios**:

1. **Given** an appointment is scheduled for tomorrow, **When** the reminder time arrives, **Then** the client receives a reminder message via Telegram
2. **Given** an appointment was completed yesterday, **When** the feedback time arrives, **Then** the client receives a feedback request with star rating
3. **Given** a client provides feedback, **When** they submit their rating, **Then** the rating is saved and associated with the appointment

---

### User Story 5 - Analytics Dashboard (Priority: P3)

An administrator can view key business metrics including bookings per month, bookings per master, most popular services, and client ratings through a visual dashboard.

**Why this priority**: Provides valuable business insights but is not essential for basic operations.

**Independent Test**: Can be fully tested by an admin accessing the dashboard and verifying that all metrics display correctly with accurate data.

**Acceptance Scenarios**:

1. **Given** an admin opens the analytics dashboard, **When** the page loads, **Then** they see charts showing bookings per month and per master
2. **Given** the dashboard displays service popularity, **When** viewing the services section, **Then** the most booked services appear at the top with booking counts
3. **Given** clients have provided ratings, **When** viewing the ratings section, **Then** average ratings and distribution are displayed

---

### Edge Cases

- What happens when a user tries to book a time slot that was just booked by someone else?
- How does system handle booking when a master's schedule changes after appointments are booked?
- What happens when Telegram bot is temporarily unavailable during booking process?
- How does system handle users marked as "unreliable" trying to book appointments?
- What happens when a user has 2 or more active bookings and tries to book another?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow clients to browse available services with prices and durations
- **FR-002**: System MUST enable clients to select masters and view their available time slots
- **FR-003**: System MUST support booking multiple services in a single appointment with live price calculation
- **FR-004**: System MUST prevent users marked as "unreliable" from making new bookings
- **FR-005**: System MUST hide booking button when user has 2 or more active bookings
- **FR-006**: System MUST provide Telegram Mini App integration for rich booking experience
- **FR-007**: System MUST send automated appointment reminders 24 hours before scheduled time
- **FR-008**: System MUST request feedback 24 hours after completed appointments with 1-5 star rating
- **FR-009**: System MUST provide admin interface for appointment management (CRUD operations)
- **FR-010**: System MUST allow admins to mark clients as "no-show" and manage reliability status
- **FR-011**: System MUST support master profile creation and weekly schedule management
- **FR-012**: System MUST enable service management with categories, pricing, and duration
- **FR-013**: System MUST provide analytics dashboard with key business metrics
- **FR-014**: System MUST support Ukrainian language for all user-facing text
- **FR-015**: System MUST authenticate admin users and protect admin routes

### Key Entities

- **User**: Client profile with telegram ID, name, phone, booking history, reliability status, and admin role
- **Service**: Nail salon service with name, price, duration, and category classification
- **MasterProfile**: Service provider with work schedule, contact info, and service associations
- **Schedule**: Weekly availability patterns for each master with working hours and days
- **Appointment**: Booking record linking user, master, services, date, time, and status
- **Review**: Client feedback with star rating, optional comment, and appointment association

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clients can complete a full booking process in under 3 minutes from start to confirmation
- **SC-002**: System supports 100 concurrent users booking appointments without performance degradation
- **SC-003**: 95% of appointment reminders are successfully delivered 24 hours before scheduled time
- **SC-004**: Admin users can manage appointments (view, create, edit, delete) with average response time under 2 seconds
- **SC-005**: 90% of clients successfully complete their first booking attempt without assistance
- **SC-006**: System reduces no-show rate by 40% through automated reminders and reliability tracking
- **SC-007**: Analytics dashboard provides accurate business metrics with data refresh time under 5 seconds