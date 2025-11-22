import { w as writable } from "./exports.js";
const createAuthStore = () => {
  const { subscribe, set, update } = writable({
    user: null,
    token: null,
    isAuthenticated: false,
    isRegistered: false,
    loading: true,
    error: null
  });
  return {
    subscribe,
    setUser: (user, token = null) => {
      update((state) => ({
        ...state,
        user,
        token: token || state.token,
        isAuthenticated: true,
        isRegistered: user.is_registered,
        loading: false,
        error: null
      }));
      if (token) {
        localStorage.setItem("auth_token", token);
      }
    },
    setLoading: (loading) => {
      update((state) => ({ ...state, loading }));
    },
    setError: (error) => {
      update((state) => ({ ...state, error, loading: false }));
    },
    clearAuth: () => {
      localStorage.removeItem("auth_token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isRegistered: false,
        loading: false,
        error: null
      });
    },
    getToken: () => {
      return localStorage.getItem("auth_token");
    }
  };
};
const authStore = createAuthStore();
export {
  authStore as a
};
