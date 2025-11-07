const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Booking service for Telegram bot
 * Integrates with backend API for booking operations
 */
class BookingService {
  constructor() {
    this.apiBase = config.env === 'production' 
      ? 'http://backend:3000/api' 
      : 'http://localhost:3000/api';
  }

  /**
   * Get available services
   */
  async getServices() {
    try {
      const response = await axios.get(`${this.apiBase}/v1/services`);
      return response.data.data.services;
    } catch (error) {
      logger.error('Error fetching services:', error);
      throw new Error('Не вдалося завантажити послуги');
    }
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/services/category/${encodeURIComponent(category)}`);
      return response.data.data.services;
    } catch (error) {
      logger.error('Error fetching services by category:', error);
      throw new Error('Не вдалося завантажити послуги з цієї категорії');
    }
  }

  /**
   * Get service categories
   */
  async getCategories() {
    try {
      const response = await axios.get(`${this.apiBase}/v1/services/categories`);
      return response.data.data.categories;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw new Error('Не вдалося завантажити категорії');
    }
  }

  /**
   * Get available masters for a service
   */
  async getMastersForService(serviceId) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/masters/service/${serviceId}`);
      return response.data.data.masters;
    } catch (error) {
      logger.error('Error fetching masters for service:', error);
      throw new Error('Не вдалося завантажити майстрів для цієї послуги');
    }
  }

  /**
   * Get master availability for a specific date
   */
  async getMasterAvailability(masterId, date) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/masters/${masterId}/availability`, {
        params: { date }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching master availability:', error);
      throw new Error('Не вдалося перевірити доступність майстра');
    }
  }

  /**
   * Get master schedule
   */
  async getMasterSchedule(masterId) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/masters/${masterId}/schedule`);
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching master schedule:', error);
      throw new Error('Не вдалося завантажити розклад майстра');
    }
  }

  /**
   * Check booking availability
   */
  async checkAvailability(masterId, serviceId, date, time) {
    try {
      const response = await axios.post(`${this.apiBase}/v1/bookings/flow/availability`, {
        masterId,
        serviceId,
        date,
        time
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error checking availability:', error);
      if (error.response && error.response.status === 409) {
        throw new Error('Цей час вже зайнятий. Оберіть інший час.');
      }
      throw new Error('Не вдалося перевірити доступність');
    }
  }

  /**
   * Create booking
   */
  async createBooking(bookingData) {
    try {
      const response = await axios.post(`${this.apiBase}/v1/bookings/flow/confirm`, bookingData);
      return response.data.data;
    } catch (error) {
      logger.error('Error creating booking:', error);
      if (error.response && error.response.status === 409) {
        throw new Error('На жаль, цей час щойно зайнявся. Спробуйте інший час.');
      }
      throw new Error('Не вдалося створити запис');
    }
  }

  /**
   * Get user appointments
   */
  async getUserAppointments(telegramId) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/appointments`, {
        headers: {
          'X-Telegram-ID': telegramId.toString()
        }
      });
      return response.data.data.appointments;
    } catch (error) {
      logger.error('Error fetching user appointments:', error);
      throw new Error('Не вдалося завантажити ваші записи');
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId, telegramId) {
    try {
      const response = await axios.post(`${this.apiBase}/v1/appointments/${appointmentId}/cancel`, {}, {
        headers: {
          'X-Telegram-ID': telegramId.toString()
        }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      if (error.response && error.response.status === 400) {
        throw new Error('Не вдалося скасувати запис. Можливо, термін скасування минув.');
      }
      throw new Error('Не вдалося скасувати запис');
    }
  }

  /**
   * Get service by ID
   */
  async getService(serviceId) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/services/${serviceId}`);
      return response.data.data.service;
    } catch (error) {
      logger.error('Error fetching service:', error);
      throw new Error('Не вдалося знайти послугу');
    }
  }

  /**
   * Get master by ID
   */
  async getMaster(masterId) {
    try {
      const response = await axios.get(`${this.apiBase}/v1/masters/${masterId}`);
      return response.data.data.master;
    } catch (error) {
      logger.error('Error fetching master:', error);
      throw new Error('Не вдалося знайти майстра');
    }
  }

  /**
   * Initialize booking flow
   */
  async initializeBookingFlow() {
    try {
      const response = await axios.get(`${this.apiBase}/v1/bookings/flow/init`);
      return response.data.data;
    } catch (error) {
      logger.error('Error initializing booking flow:', error);
      throw new Error('Не вдалося ініціалізувати процес запису');
    }
  }

  /**
   * Format date for API
   */
  formatDateForApi(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Format time for API
   */
  formatTimeForApi(time) {
    return time; // HH:MM format
  }

  /**
   * Generate available dates (next 7 days)
   */
  generateAvailableDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (optional)
      // if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      dates.push({
        date: this.formatDateForApi(date),
        label: date.toLocaleDateString('uk-UA', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return dates;
  }

  /**
   * Generate time slots
   */
  generateTimeSlots(workingHours = { start: '09:00', end: '19:00' }) {
    const slots = [];
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      slots.push(time);
      
      // Add 30 minutes
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  }
}

// Create singleton instance
const bookingService = new BookingService();

module.exports = bookingService;