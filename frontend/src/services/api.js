/**
 * API Service for frontend-backend communication
 */

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    this.token = null;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set authentication token from localStorage
   */
  setAuthToken(token) {
    this.token = token;
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add Telegram user ID if available
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      headers['X-Telegram-ID'] = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Services API
  async getServices(filters = {}) {
    return this.get('/services', filters);
  }

  async getServiceById(id) {
    return this.get(`/services/${id}`);
  }

  async getServicesByCategory(category) {
    return this.get(`/services/category/${category}`);
  }

  async getServicesCategories() {
    return this.get('/services/categories');
  }

  async getPopularServices(limit = 10) {
    return this.get('/services/popular', { limit });
  }

  async searchServices(query, filters = {}) {
    return this.get('/services/search', { q: query, ...filters });
  }

  // Masters API
  async getMasters() {
    return this.get('/masters');
  }

  async getMasterById(id) {
    return this.get(`/masters/${id}`);
  }

  async getMastersByCategory(category) {
    return this.get(`/masters/category/${category}`);
  }

  async getMastersByService(serviceId) {
    return this.get(`/masters/service/${serviceId}`);
  }

  async getMasterAvailability(masterId, date, serviceIds) {
    const params = { date };
    if (serviceIds) {
      params.serviceIds = serviceIds.join(',');
    }
    return this.get(`/masters/${masterId}/availability`, params);
  }

  async getMasterSchedule(masterId, startDate, endDate) {
    return this.get(`/masters/${masterId}/schedule`, { startDate, endDate });
  }

  // Appointments API
  async getAppointments(filters = {}) {
    return this.get('/appointments', filters);
  }

  async getAppointmentById(id) {
    return this.get(`/appointments/${id}`);
  }

  async createAppointment(appointmentData) {
    return this.post('/appointments', appointmentData);
  }

  async createBookingFlow(bookingData) {
    return this.post('/bookings/flow/confirm', bookingData);
  }

  async updateAppointmentStatus(id, status, adminNotes) {
    return this.put(`/appointments/${id}/status`, { status, adminNotes });
  }

  async cancelAppointment(id, reason) {
    return this.post(`/appointments/${id}/cancel`, { reason });
  }

  async getUpcomingAppointments(days = 7, masterId) {
    const params = { days };
    if (masterId) {
      params.masterId = masterId;
    }
    return this.get('/appointments/upcoming', params);
  }

  // Auth API
  async login(credentials) {
    const response = await this.post('/login', credentials);
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/logout');
    } finally {
      this.setToken(null);
    }
  }

  // User Appointments API
  async getUserAppointments(filters = {}) {
    return this.get('/user/appointments', filters);
  }

  async cancelAppointment(id, reason) {
    return this.post(`/appointments/${id}/cancel`, { reason });
  }

  // Reviews API
  async createReview(reviewData) {
    return this.post('/reviews', reviewData);
  }

  async getReviews(filters = {}) {
    return this.get('/reviews', filters);
  }

  async getReviewsByService(serviceId) {
    return this.get(`/reviews/service/${serviceId}`);
  }

  async getReviewsByMaster(masterId) {
    return this.get(`/reviews/master/${masterId}`);
  }

  // User Profile API
  async getUserProfile() {
    return this.get('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.put('/user/profile', profileData);
  }

  // Health check
  async healthCheck() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return this.request(`${baseURL}/api/health`, {
      method: 'GET',
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export both as default and named export for compatibility
export default apiService;

// Named export for components that import { api }
export const api = apiService;