# Tasks for "Shanails" Project v3.1

This is the primary instruction set. Execute these tasks sequentially.

---
### Phase 1: Backend and Database Setup ✅ COMPLETED

**Goal:** Create the core backend service and database structure.

*   `[X] T01` Initialize a new **FastAPI** project in the `/backend` directory.
*   `[X] T02` In `docker-compose.yml`, define the `postgres` service using the official `postgres:15-alpine` image and a named volume for data.
*   `[X] T03` In the `backend` directory, create a `models.py` file. Define all database tables using **SQLAlchemy** based on the schema provided below.
*   `[X] T04` Implement a script `seed.py` to populate the database with 2-3 sample masters, several services, and a weekly schedule for each master. Include an `ADMIN` user.
*   `[X] T05` **Implement API Endpoint:** `GET /api/v1/masters/{master_id}/availability`. It must accept a `date` query parameter (YYYY-MM-DD). The logic must:
    *   Generate fixed 2-hour time slots from 10:00 to 20:00.
    *   Check the master's schedule and existing appointments.
    *   Return only the slots that are free and do not overlap.

---
### Phase 2: Frontend Implementation

**Goal:** Build the client-facing booking interface.

*   `[X] T10` Initialize a new **SvelteKit** project in the `/frontend` directory.
*   `[X] T11` Create a main booking page (`/booking`) with three components:
    1.  `MasterSelector.svelte`: Fetches and displays a list of masters from `GET /api/v1/masters`.
    2.  `DateTimePicker.svelte`: After a master is selected, displays a calendar. It must call `GET /api/v1/masters/{master_id}/availability` for the selected date to fetch and display the real, available 2-hour slots.
    3.  `ServiceSelector.svelte`: After a time is selected, fetches services from `GET /api/v1/services`. It MUST disable the "Confirm" button and show a warning if the total duration of selected services exceeds 120 minutes.
*   `[X] T12` Implement the "Confirm Booking" button. On click, it must send a `POST /api/v1/appointments` request with `{ masterId, serviceIds, appointmentTime }`.
*   `[X] T13` Ensure the entire UI is responsive, clean, and optimized for mobile devices.
*   `[X] T14` Unify button behavior in ServiceSelector component: Make "—" (Remove) button collapse accordion immediately after click to match "+" (Add) button behavior for consistent user experience.
*   `[X] T15` Visually highlight service categories with selected items: Add `isCategorySelected()` helper function and conditional CSS class to highlight accordion headers when they contain selected services.

---
### Phase 3: Telegram Bot Integration

**Goal:** Make the booking flow accessible through Telegram.

*   `[T20]` In the `backend` directory, create `bot.py`. Use the `python-telegram-bot` library.
*   `[T21]` Implement the `/start` command handler. It MUST reply with a welcome message and an inline keyboard.
*   `[T22]` The "Записатися" button on the keyboard MUST be a `web_app` button pointing to the frontend's booking page URL (use an environment variable).

---
### **Appendix: Database Schema Definition**

```prisma
// Use this as a reference for your SQLAlchemy models.

model User {
  id Int @id @default(autoincrement())
  telegramId BigInt? @unique
  name String
  phone String?
  role String @default("CLIENT") // 'CLIENT' or 'ADMIN'
}

model Master {
  id Int @id @default(autoincrement())
  userId Int @unique
  schedules Schedule[]
  appointments Appointment[]
}

model Service {
  id Int @id @default(autoincrement())
  name String
  price Float
  duration Int // in minutes
}

model Schedule {
  id Int @id @default(autoincrement())
  masterId Int
  dayOfWeek Int // 1=Monday, 7=Sunday
  startTime String // "10:00"
  endTime String // "20:00"
}

model Appointment {
  id Int @id @default(autoincrement())
  userId Int
  masterId Int
  startTime DateTime
  endTime DateTime
  totalPrice Float
  status String @default("SCHEDULED")
}

// Junction table for many-to-many relationship
model _AppointmentServices {
  A Int // Corresponds to Appointment ID
  B Int // Corresponds to Service ID
}
