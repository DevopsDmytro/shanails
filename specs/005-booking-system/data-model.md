# Data Model: Complete Nail Salon Booking System

**Date**: 2025-11-04  
**Based on**: Feature specification and research findings

## Core Entities

### User
Represents all system users including customers, masters (staff), and administrators.

**Fields**:
- `id` (BIGINT, Primary Key) - Unique identifier
- `telegramId` (BIGINT, Unique) - Telegram user ID for bot integration
- `email` (VARCHAR(255), Unique) - Email address for admin accounts
- `phone` (VARCHAR(20), Unique) - Phone number for customers
- `firstName` (VARCHAR(100), Required) - First name
- `lastName` (VARCHAR(100), Required) - Last name
- `role` (ENUM: 'CUSTOMER', 'MASTER', 'ADMIN', Required) - User role
- `isActive` (BOOLEAN, Default: true) - Account status
- `isBlocked` (BOOLEAN, Default: false) - Booking restriction flag
- `isUnreliable` (BOOLEAN, Default: false) - No-show tracking flag
- `notes` (TEXT) - Internal admin notes
- `timezone` (VARCHAR(50), Default: 'Europe/Kyiv') - User timezone
- `createdAt` (TIMESTAMPTZ, Required) - Account creation timestamp
- `updatedAt` (TIMESTAMPTZ, Required) - Last update timestamp

**Validation Rules**:
- Email required for ADMIN role
- Phone required for CUSTOMER role
- Telegram ID required for CUSTOMER role
- Only one ADMIN can be blocked/unblocked by other admins

### Service
Represents nail salon services offered to customers.

**Fields**:
- `id` (BIGINT, Primary Key) - Unique identifier
- `name` (VARCHAR(200), Required) - Service name (Ukrainian)
- `description` (TEXT) - Service description
- `price` (DECIMAL(10,2), Required, >= 0) - Service price in UAH
- `duration` (INTEGER, Required, > 0) - Duration in minutes
- `category` (VARCHAR(50), Required) - Service category
- `isActive` (BOOLEAN, Default: true) - Service availability
- `createdAt` (TIMESTAMPTZ, Required) - Creation timestamp
- `updatedAt` (TIMESTAMPTZ, Required) - Last update timestamp

**Validation Rules**:
- Price must be positive
- Duration must be between 15 and 480 minutes (8 hours max)
- Name cannot be empty
- Category must be predefined (Маникюр, Педикюр, Наращивание, etc.)

### MasterProfile
Extends User for nail technicians with additional professional information.

**Fields**:
- `id` (BIGINT, Primary Key) - Unique identifier
- `userId` (BIGINT, Foreign Key → User.id, Required) - Linked user account
- `employeeCode` (VARCHAR(20), Unique, Required) - Internal employee code
- `commissionRate` (DECIMAL(5,2), 0-100) - Commission percentage
- `isActive` (BOOLEAN, Default: true) - Employment status
- `specializations` (TEXT[]) - Array of service categories they can perform
- `experience` (INTEGER) - Years of experience
- `createdAt` (TIMESTAMPTZ, Required) - Profile creation timestamp
- `updatedAt` (TIMESTAMPTZ, Required) - Last update timestamp

**Validation Rules**:
- User must have MASTER role
- Commission rate between 0 and 100
- Employee code must be unique
- At least one specialization required

### Schedule
Defines weekly working patterns for masters.

**Fields**:
- `id` (BIGINT, Primary Key) - Unique identifier
- `masterId` (BIGINT, Foreign Key → MasterProfile.id, Required) - Associated master
- `dayOfWeek` (INTEGER, 0-6, Required) - Day of week (0=Sunday)
- `startTime` (TIME, Required) - Work start time
- `endTime` (TIME, Required) - Work end time
- `isActive` (BOOLEAN, Default: true) - Schedule status
- `createdAt` (TIMESTAMPTZ, Required) - Creation timestamp
- `updatedAt` (TIMESTAMPTZ, Required) - Last update timestamp

**Validation Rules**:
- End time must be after start time
- Minimum shift duration: 4 hours
- Maximum shift duration: 12 hours
- No overlapping schedules for same master
- Day of week must be 0-6

### Appointment
Core booking entity representing customer appointments.

**Fields**:
- `id` (BIGINT, Primary Key) - Unique identifier
- `customerId` (BIGINT, Foreign Key → User.id, Required) - Customer user
- `masterId` (BIGINT, Foreign Key → MasterProfile.id, Required) - Assigned master
- `serviceIds` (BIGINT[], Required) - Array of service IDs
- `startTime` (TIMESTAMPTZ, Required) - Appointment start time
- `endTime` (TIMESTAMPTZ, Required) - Appointment end time
- `status` (ENUM: 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', Default: 'SCHEDULED')
- `totalPrice` (DECIMAL(10,2), Required, >= 0) - Total appointment cost
- `customerNotes` (TEXT) - Customer special requests
- `adminNotes` (TEXT) - Internal admin notes
- `reminderSent` (BOOLEAN, Default: false) - 24h reminder flag
- `feedbackRequested` (BOOLEAN, Default: false) - Feedback request flag
- `createdAt` (TIMESTAMPTZ, Required) - Booking timestamp
- `updatedAt` (TIMESTAMPTZ, Required) - Last update timestamp

**Validation Rules**:
- End time must be after start time
- Start time must be in future (except for admin creation)
- Customer cannot have more than 2 active appointments
- Customer must not be blocked or unreliable
- Master must be available at requested time
- Total price must match sum of service prices
- No overlapping appointments for same master

### Review
Customer feedback for completed appointments.

**Fields**:
- `id` (BIGINT, Primary Key) - Unique identifier
- `appointmentId` (BIGINT, Foreign Key → Appointment.id, Unique, Required) - Associated appointment
- `rating` (INTEGER, 1-5, Required) - Star rating
- `comment` (TEXT) - Customer comment
- `createdAt` (TIMESTAMPTZ, Required) - Review timestamp

**Validation Rules**:
- Appointment must be COMPLETED status
- Rating must be between 1 and 5
- Only one review per appointment
- Review can only be created by appointment customer

## Relationships

### User Relationships
- One-to-One: User ↔ MasterProfile (for MASTER role users)
- One-to-Many: User → Appointment (as customer)
- One-to-Many: User → Review (as customer)

### Service Relationships
- Many-to-Many: Service ↔ Appointment (through serviceIds array)
- Many-to-One: Service → MasterProfile (through specializations)

### MasterProfile Relationships
- One-to-Many: MasterProfile → Schedule
- One-to-Many: MasterProfile → Appointment
- Many-to-Many: MasterProfile → Service (through specializations)

### Appointment Relationships
- Many-to-One: Appointment → User (customer)
- Many-to-One: Appointment → MasterProfile
- Many-to-Many: Appointment → Service
- One-to-One: Appointment → Review

## State Transitions

### Appointment Status Flow
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
    ↓           ↓           ↓
CANCELLED  CANCELLED   CANCELLED
    ↓
NO_SHOW (only if missed)
```

**Transition Rules**:
- SCHEDULED → CONFIRMED: Automatic or admin action
- CONFIRMED → IN_PROGRESS: Master starts appointment
- IN_PROGRESS → COMPLETED: Master finishes appointment
- Any status → CANCELLED: Customer or admin (before IN_PROGRESS)
- CONFIRMED → NO_SHOW: Admin action after missed appointment

### User Status Flow
```
ACTIVE → BLOCKED (admin action)
ACTIVE → UNRELIABLE (after 2 no-shows)
UNRELIABLE → ACTIVE (admin action)
```

## Indexes for Performance

### Primary Indexes
- All primary keys automatically indexed
- All foreign keys automatically indexed

### Secondary Indexes
```sql
-- User indexes
CREATE INDEX idx_users_telegram_id ON users(telegramId);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(isActive) WHERE isActive = true;
CREATE INDEX idx_users_unreliable ON users(isUnreliable) WHERE isUnreliable = true;

-- Appointment indexes
CREATE INDEX idx_appointments_customer_id ON appointments(customerId);
CREATE INDEX idx_appointments_master_id ON appointments(masterId);
CREATE INDEX idx_appointments_start_time ON appointments(startTime);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_range ON appointments(
    DATE_TRUNC('day', startTime), 
    DATE_TRUNC('day', endTime)
);
CREATE INDEX idx_appointments_master_time ON appointments(masterId, startTime);

-- Service indexes
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(isActive) WHERE isActive = true;

-- Schedule indexes
CREATE INDEX idx_schedules_master_day ON schedules(masterId, dayOfWeek);
```

## Data Integrity Constraints

### Business Rules
```sql
-- Prevent overlapping appointments for same master
ALTER TABLE appointments ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING GIST (
    masterId WITH =,
    tsrange(startTime, endTime) WITH &&
) WHERE status NOT IN ('CANCELLED', 'NO_SHOW');

-- Prevent customers from having too many active appointments
CREATE FUNCTION check_customer_appointment_limit() 
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*) 
        FROM appointments 
        WHERE customerId = NEW.customerId 
        AND status IN ('SCHEDULED', 'CONFIRMED')
    ) >= 2 THEN
        RAISE EXCEPTION 'Customer cannot have more than 2 active appointments';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_customer_appointment_limit
    BEFORE INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION check_customer_appointment_limit();
```

## Audit Trail

### Appointment Audit Table
```sql
CREATE TABLE appointment_audit (
    id BIGSERIAL PRIMARY KEY,
    appointmentId BIGINT NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    oldStatus VARCHAR(20),
    newStatus VARCHAR(20),
    oldStartTime TIMESTAMPTZ,
    newStartTime TIMESTAMPTZ,
    oldMasterId BIGINT,
    newMasterId BIGINT,
    changedBy BIGINT REFERENCES users(id),
    changeTime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changeReason TEXT
);
```

## Data Migration Strategy

### Phase 1: Core Tables
1. Create users table with basic fields
2. Create services table with sample data
3. Create master_profiles table
4. Create schedules table

### Phase 2: Booking Tables
1. Create appointments table
2. Create reviews table
3. Add audit trail tables
4. Create indexes and constraints

### Phase 3: Optimization
1. Add performance indexes
2. Create partitioning for appointments
3. Set up audit triggers
4. Add data validation functions

This data model provides a comprehensive foundation for the nail salon booking system with proper relationships, constraints, and performance optimizations.