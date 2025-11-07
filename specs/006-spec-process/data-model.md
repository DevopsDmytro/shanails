# Data Model: Salon Booking System

**Date**: 2025-11-07  
**Purpose**: Entity definitions and relationships for the salon booking system

## Core Entities

### User
Represents clients and administrators in the system.

```python
class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: str | None = None
    phone: str | None = Field(index=True)
    telegram_id: int | None = Field(index=True, unique=True)
    telegram_username: str | None = None
    is_active: bool = Field(default=True)
    is_admin: bool = Field(default=False)
    language_code: str = Field(default="uk")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    appointments: List["Appointment"] = Relationship(back_populates="client")
    reviews: List["Review"] = Relationship(back_populates="client")
```

**Validation Rules:**
- Email must be valid and unique
- Phone must be in international format if provided
- Telegram ID must be unique if provided
- Language code must be supported (uk, en)

### Master
Service providers with profiles, specializations, and schedules.

```python
class Master(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    specialization: str
    description: str | None = None
    photo_url: str | None = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    appointments: List["Appointment"] = Relationship(back_populates="master")
    schedules: List["Schedule"] = Relationship(back_populates="master")
    master_services: List["MasterService"] = Relationship(back_populates="master")
    reviews: List["Review"] = Relationship(back_populates="master")
```

**Validation Rules:**
- Name must be unique among active masters
- Specialization cannot be empty
- Photo URL must be valid if provided

### Service
Individual salon services with pricing and duration.

```python
class Service(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str | None = None
    category: str = Field(index=True)
    duration_minutes: int = Field(gt=0, le=240)  # Max 4 hours
    price: float = Field(ge=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    appointments: List["Appointment"] = Relationship(back_populates="service")
    master_services: List["MasterService"] = Relationship(back_populates="service")
```

**Validation Rules:**
- Name must be unique among active services
- Duration must be between 1 and 240 minutes
- Price must be non-negative
- Category must be from predefined list

### MasterService
Many-to-many relationship between masters and services.

```python
class MasterService(SQLModel, table=True):
    master_id: int = Field(foreign_key="master.id", primary_key=True)
    service_id: int = Field(foreign_key="service.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    master: Master = Relationship(back_populates="master_services")
    service: Service = Relationship(back_populates="master_services")
```

**Validation Rules:**
- Master must be active
- Service must be active
- Combination must be unique

### Schedule
Master's working hours and availability patterns.

```python
class Schedule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    master_id: int = Field(foreign_key="master.id")
    day_of_week: int = Field(ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: time = Field(...)  # e.g., 09:00
    end_time: time = Field(...)    # e.g., 18:00
    is_available: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    master: Master = Relationship(back_populates="schedules")
```

**Validation Rules:**
- Day of week must be 0-6
- Start time must be before end time
- Master must be active
- Only one schedule per master per day

### Appointment
Booked sessions linking client, master, services, time, and status.

```python
class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"

class Appointment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    client_id: int = Field(foreign_key="user.id")
    master_id: int = Field(foreign_key="master.id")
    service_id: int = Field(foreign_key="service.id")
    start_time: datetime = Field(...)
    end_time: datetime = Field(...)
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING)
    total_price: float = Field(ge=0)
    total_duration_minutes: int = Field(gt=0)
    notes: str | None = None
    telegram_message_id: int | None = None  # For bot notifications
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    client: User = Relationship(back_populates="appointments")
    master: Master = Relationship(back_populates="appointments")
    service: Service = Relationship(back_populates="appointments")
    reviews: List["Review"] = Relationship(back_populates="appointment")
```

**Validation Rules:**
- Start time must be in the future (at least 24 hours)
- End time must be after start time
- Total duration must match service duration
- Total price must match service price
- No overlapping appointments for same master
- Master must be available at scheduled time
- Client must be active

### Review
Client feedback and ratings for completed appointments.

```python
class Review(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    appointment_id: int = Field(foreign_key="appointment.id", unique=True)
    client_id: int = Field(foreign_key="user.id")
    master_id: int = Field(foreign_key="master.id")
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    comment: str | None = None
    is_public: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    appointment: Appointment = Relationship(back_populates="reviews")
    client: User = Relationship(back_populates="reviews")
    master: Master = Relationship(back_populates="reviews")
```

**Validation Rules:**
- Rating must be between 1 and 5
- Appointment must be completed
- Only one review per appointment
- Client must be the appointment client

## Entity Relationships

### Relationship Diagram
```
User (1) -----> (N) Appointment
Master (1) ----> (N) Appointment
Service (1) ---> (N) Appointment

Master (1) ----> (N) Schedule
Master (N) <--> (N) Service (through MasterService)

User (1) -----> (N) Review
Master (1) ----> (N) Review
Appointment (1) -> (1) Review
```

### Key Constraints
1. **Unique Constraints**:
   - User.email, User.telegram_id
   - Master.name (among active masters)
   - Service.name (among active services)
   - Review.appointment_id

2. **Foreign Key Constraints**:
   - All relationships maintain referential integrity
   - Cascade delete for dependent records
   - Restrict delete for masters/services with appointments

3. **Business Constraints**:
   - No overlapping appointments for same master
   - Appointments must be within master's schedule
   - Services must be available with selected master
   - Reviews only for completed appointments

## State Transitions

### Appointment Status Flow
```
PENDING -> CONFIRMED -> COMPLETED -> REVIEW
   |           |            |
   v           v            v
CANCELLED  CANCELLED    NO_SHOW
```

**Transition Rules:**
- PENDING → CONFIRMED: Automatic or admin approval
- PENDING → CANCELLED: Client or admin cancellation
- CONFIRMED → COMPLETED: After service delivery
- CONFIRMED → CANCELLED: Before 24 hours of appointment
- CONFIRMED → NO_SHOW: After missed appointment
- COMPLETED → REVIEW: Client creates review

## Database Indexes

### Primary Indexes
- All primary keys (id fields)
- All foreign keys (relationship fields)

### Secondary Indexes
- User.email, User.telegram_id, User.phone
- Master.name, Master.is_active
- Service.name, Service.category, Service.is_active
- Appointment.start_time, Appointment.status, Appointment.client_id, Appointment.master_id
- Schedule.master_id, Schedule.day_of_week
- Review.rating, Review.is_public

### Composite Indexes
- Appointment(master_id, start_time) - for availability checks
- Appointment(client_id, start_time) - for client history
- Schedule(master_id, day_of_week) - for master availability

## Data Validation

### Input Validation
- Email format validation
- Phone number format (international)
- Date/time validation (future dates, business hours)
- Price and duration validation (positive values)
- Rating validation (1-5 range)

### Business Logic Validation
- Master availability checks
- Service duration limits (max 120 minutes per booking)
- Double booking prevention
- 24-hour minimum booking notice
- Review creation only for completed appointments

## Security Considerations

### Data Protection
- Password hashing with bcrypt
- Personal data encryption
- Audit logging for sensitive operations
- Data retention policies

### Access Control
- Role-based permissions (admin vs client)
- Appointment privacy (client can only see own appointments)
- Review moderation (admin can hide inappropriate reviews)

## Performance Considerations

### Query Optimization
- Proper indexing for common queries
- Efficient availability checking
- Optimized calendar generation
- Fast search and filtering

### Caching Strategy
- Master schedules (cache for 1 hour)
- Service catalog (cache for 30 minutes)
- User preferences (cache for 24 hours)
- Popular time slots (cache for 15 minutes)

This data model provides a solid foundation for the salon booking system with proper normalization, constraints, and performance considerations.