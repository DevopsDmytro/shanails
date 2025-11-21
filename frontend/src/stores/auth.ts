import { writable } from 'svelte/store';

export interface User {
    id: number;
    telegram_id: number | null;
    name: string;
    phone: string | null;
    role: string;
    is_registered: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isRegistered: boolean;
    loading: boolean;
    error: string | null;
}

const createAuthStore = () => {
    const { subscribe, set, update } = writable<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isRegistered: false,
        loading: true,
        error: null
    });

    return {
        subscribe,
        setUser: (user: User, token: string | null = null) => {
            update((state) => ({
                ...state,
                user,
                token: token || state.token,
                isAuthenticated: true,
                isRegistered: user.is_registered,
                loading: false,
                error: null
            }));

            // Store token in localStorage
            if (token) {
                localStorage.setItem('auth_token', token);
            }
        },
        setLoading: (loading: boolean) => {
            update((state) => ({ ...state, loading }));
        },
        setError: (error: string | null) => {
            update((state) => ({ ...state, error, loading: false }));
        },
        clearAuth: () => {
            localStorage.removeItem('auth_token');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isRegistered: false,
                loading: false,
                error: null
            });
        },
        getToken: (): string | null => {
            return localStorage.getItem('auth_token');
        }
    };
};

export const authStore = createAuthStore();
