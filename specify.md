# (Add this new section to your specify.md)

### User Authentication

*   **Primary Flow (Telegram Mini App):** When the app is opened from the bot, the user must be authenticated **seamlessly and automatically** using their Telegram account data.
*   **Secondary Flow (Desktop/Web):** For users accessing the website directly, a **"Login with Telegram"** button must be available.
*   **Data Requirement:** The system must request the user's **name and phone number** during the first login. If a user already exists in the database (matched by `telegramId`), they are simply logged in.
*   **Session Management:** After successful authentication, the user's session must be maintained, allowing them to make bookings without logging in again.
