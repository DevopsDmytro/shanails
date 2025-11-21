// Configuration for the frontend application
export const config = {
    // Telegram bot username (for web visitor redirects)
    botUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'sha_nails_test',

    // API base URL
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',

    // Feature flags
    features: {
        debugMode: import.meta.env.DEV,
    }
};
