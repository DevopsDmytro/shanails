class Auth {
  constructor() {
    this.tokenKey = 'adminToken';
    this.userKey = 'adminUser';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (!token || !user) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = this.parseJWT(token);
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error parsing token:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Get authentication token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.userKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Set authentication data
   */
  setAuth(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Clear authentication data
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Redirect to login page
    if (window.location.hash !== '#/admin/login') {
      window.location.hash = '#/admin/login';
    }
  }

  /**
   * Check if user has admin role
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'ADMIN';
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Parse JWT token
   */
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.parseJWT(token);
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    const expiration = this.getTokenExpiration();
    if (!expiration) return true;
    
    return new Date() >= expiration;
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded() {
    if (!this.isAuthenticated()) {
      return false;
    }

    // If token expires in less than 5 minutes, try to refresh
    const expiration = this.getTokenExpiration();
    if (expiration && (expiration.getTime() - Date.now()) < 5 * 60 * 1000) {
      try {
        // Implement token refresh logic if your API supports it
        // For now, just logout and require re-authentication
        this.logout();
        return false;
      } catch (error) {
        console.error('Error refreshing token:', error);
        this.logout();
        return false;
      }
    }

    return true;
  }

  /**
   * Protect routes - redirect to login if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      this.logout();
      return false;
    }

    if (!this.isAdmin()) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Get authorization header
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Setup automatic token refresh
   */
  setupAutoRefresh() {
    // Check token every minute
    setInterval(() => {
      this.refreshTokenIfNeeded();
    }, 60 * 1000);
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error) {
    if (error.status === 401) {
      this.logout();
      return true;
    }
    
    if (error.status === 403) {
      // Forbidden - user doesn't have required permissions
      console.error('Access forbidden: insufficient permissions');
      return true;
    }
    
    return false;
  }
}

// Create singleton instance
export const auth = new Auth();

// Export default for convenience
export default auth;