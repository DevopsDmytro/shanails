/**
 * Authentication Service for Telegram WebApp
 * Handles login via Telegram initData, registration, and JWT token management
 */

import { authStore } from '../stores/auth';
import { telegramAuth, register as registerUser, getCurrentUser } from '../lib/api';
import { isTelegram, getInitData } from '../lib/telegram';

/**
 * Initialize authentication on app load
 * Checks localStorage for existing token and validates it
 */
export async function initAuth(): Promise<void> {
    const token = authStore.getToken();

    if (token) {
        try {
            // Validate token and get current user
            const user = await getCurrentUser(token);
            authStore.setUser(user, token);
        } catch (error) {
            console.error('Token validation failed:', error);
            authStore.clearAuth();
        }
    } else {
        authStore.setLoading(false);
    }
}

/**
 * Authenticate with Telegram WebApp initData
 * Returns user data and indicates if registration is needed
 */
export async function authenticateWithTelegram(): Promise<{
    needsRegistration: boolean;
    user: any;
    token: string | null;
}> {
    if (!isTelegram()) {
        throw new Error('Not in Telegram environment');
    }

    const initData = getInitData();
    if (!initData) {
        throw new Error('No Telegram initData available');
    }

    try {
        console.log('Sending auth request with initData:', initData);
        const response = await telegramAuth(initData);
        console.log('Auth response:', response);

        if (response.needs_registration) {
            console.log('User needs registration');
            // User exists but needs to complete registration
            return {
                needsRegistration: true,
                user: response.user,
                token: response.token
            };
        } else {
            console.log('User authenticated successfully');
            // User is fully registered, set auth state
            authStore.setUser(response.user, response.token);
            return {
                needsRegistration: false,
                user: response.user,
                token: response.token
            };
        }
    } catch (error) {
        console.error('Telegram authentication failed:', error);
        throw error;
    }
}

/**
 * Complete user registration with name and phone
 */
export async function completeRegistration(
    telegramId: number,
    name: string,
    phone: string
): Promise<void> {
    try {
        const response = await registerUser(telegramId, name, phone);
        authStore.setUser(response.user, response.token);
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
}

/**
 * Logout and clear authentication state
 */
export function logout(): void {
    authStore.clearAuth();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    const token = authStore.getToken();
    return !!token;
}
