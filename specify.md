# Feature Specification for "shanails" Booking System - v2.3

All user-facing text MUST be in Ukrainian.

**1. Client-Facing Features (Bot, Web App & Website):**

*   **Main Menu:** Presents buttons: **"Послуги та ціни"**, **"Контакти"**, **"Записатися"**.
    *   The "Записатися" button is hidden if the user has 2 or more active bookings.
*   **Booking Flow:**
    1.  The user selects a master ("Анна", "Віка", etc.), a service (or multiple services with live price calculation), a date, and an available time slot.
    2.  The system prevents booking if the user is marked as "unreliable".
    3.  A clean confirmation message is displayed with all appointment details.
*   **Telegram Mini App Integration:** The "Записатися" button in Telegram opens the frontend application as a Telegram Mini App, providing a rich, graphical booking experience directly within Telegram.
*   **Appointment Reminders:** The system automatically sends a reminder via the Telegram bot 24 hours before a scheduled appointment.
*   **Post-Appointment Feedback:** 24 hours after an appointment, the bot sends a message asking to **"Залишити відгук"** with a 1-5 star rating system.

**2. Admin Panel Functionality (Web Interface for `ADMIN` role):**

*   **Access:** A protected section of the website (e.g., `/admin`), accessible only to authenticated `ADMIN` users.
*   **Appointment Management:**
    *   View, filter, create, edit, and delete all appointments.
    *   Mark a client as a "no-show" for a specific appointment.
*   **Client Management:**
    *   View a list of all clients.
    *   Manually block a user from booking.
    *   Mark a user as "unreliable" (e.g., after 2 no-shows) and add an internal comment.
*   **Master & Schedule Management:**
    *   Create and edit master profiles.
    *   Define a weekly work schedule for each master (e.g., "Анна works 10:00-20:00 on Mon, Wed, Fri"). The booking system must use this schedule to generate available time slots.
*   **Service Management (CRUD):**
    *   Create, edit, and delete service categories and individual services (name, price, duration).
*   **Analytics Dashboard:**
    *   View key metrics: bookings per month, bookings per master, most popular services, and client ratings.
