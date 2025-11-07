The generated tasks for the Telegram bot are not specific enough about implementing the Telegram Mini App. Please update the `tasks.md` file with the following changes:

1.  Add a new task under "Implementation for User Story 1" to modify `backend/src/telegram/commands.js`. This task should explicitly state to use an inline button of type `web_app` for the "Записатися" command, which will open the frontend application.
2.  Add a new task under "Implementation for User Story 1" to add the Telegram Web App SDK script (`<script src="https://telegram.org/js/telegram-web-app.js"></script>`) to the `<head>` of the `frontend/index.html` file.
3.  Add another task to modify `frontend/main.js` to check for `window.Telegram.WebApp.initData` on startup. If it exists, the app should adapt its UI/UX for the Mini App mode (e.g., by using Telegram's theme colors and main button).
