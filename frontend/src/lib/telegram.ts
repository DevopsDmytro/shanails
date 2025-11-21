/**
 * Telegram WebApp SDK Integration
 * Utilities for working with Telegram WebApp API
 */

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
        };
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    version: string;
    platform: string;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

/**
 * Check if running in Telegram WebApp environment
 * Note: We check for initData presence, not just the script,
 * because the telegram-web-app.js script loads in all browsers
 * but only provides initData when actually running in Telegram WebApp
 */
export function isTelegram(): boolean {
    if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        return false;
    }

    // Check if we have actual Telegram WebApp initData or initDataUnsafe
    // The script can load in any browser, but these will only have data in real Telegram WebApp
    const webApp = window.Telegram.WebApp;
    return !!(webApp.initData || webApp.initDataUnsafe?.user);
}

/**
 * Get Telegram WebApp initData for authentication
 */
export function getInitData(): string {
    if (!isTelegram()) {
        return '';
    }
    return window.Telegram!.WebApp.initData;
}

/**
 * Get Telegram user data (unsafe, not verified)
 * Use only for display purposes, not authentication
 */
export function getTelegramUser() {
    if (!isTelegram()) {
        return null;
    }
    return window.Telegram!.WebApp.initDataUnsafe.user || null;
}

/**
 * Signal to Telegram that WebApp is ready
 */
export function ready() {
    if (isTelegram()) {
        window.Telegram!.WebApp.ready();
    }
}

/**
 * Expand WebApp to full height
 */
export function expand() {
    if (isTelegram()) {
        window.Telegram!.WebApp.expand();
    }
}

/**
 * Close WebApp
 */
export function close() {
    if (isTelegram()) {
        window.Telegram!.WebApp.close();
    }
}

/**
 * Initialize Telegram WebApp
 * Call this when your app loads
 */
export function initTelegramWebApp() {
    if (isTelegram()) {
        ready();
        expand();
    }
}
