const logger = require('../utils/logger');

/**
 * Booking state management for Telegram bot
 * Handles user booking sessions and state transitions
 */
class BookingStateService {
  constructor() {
    this.sessions = new Map(); // userId -> booking session
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Create or get a booking session for user
   */
  getOrCreateSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        step: 'service_selection',
        data: {
          serviceId: null,
          masterId: null,
          date: null,
          time: null,
          customerInfo: {}
        },
        createdAt: new Date(),
        lastActivity: new Date()
      });
      logger.info(`Created new booking session for user ${userId}`);
    }

    const session = this.sessions.get(userId);
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Update session data
   */
  updateSession(userId, updates) {
    const session = this.getOrCreateSession(userId);
    
    if (updates.step) {
      session.step = updates.step;
    }
    
    if (updates.data) {
      session.data = { ...session.data, ...updates.data };
    }
    
    session.lastActivity = new Date();
    logger.info(`Updated booking session for user ${userId}:`, { step: session.step, data: session.data });
  }

  /**
   * Get user session
   */
  getSession(userId) {
    return this.sessions.get(userId);
  }

  /**
   * Clear user session
   */
  clearSession(userId) {
    this.sessions.delete(userId);
    logger.info(`Cleared booking session for user ${userId}`);
  }

  /**
   * Check if session is complete
   */
  isSessionComplete(userId) {
    const session = this.getSession(userId);
    if (!session) return false;

    const { data } = session;
    return data.serviceId && data.masterId && data.date && data.time;
  }

  /**
   * Get booking summary
   */
  getBookingSummary(userId) {
    const session = this.getSession(userId);
    if (!session) return null;

    return {
      step: session.step,
      serviceId: session.data.serviceId,
      masterId: session.data.masterId,
      date: session.data.date,
      time: session.data.time,
      customerInfo: session.data.customerInfo
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired booking sessions`);
    }
  }

  /**
   * Get all active sessions (for admin purposes)
   */
  getActiveSessions() {
    const now = new Date();
    const activeSessions = [];

    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActivity <= this.SESSION_TIMEOUT) {
        activeSessions.push({
          userId,
          step: session.step,
          data: session.data,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        });
      }
    }

    return activeSessions;
  }

  /**
   * Reset session to specific step
   */
  resetSessionToStep(userId, step) {
    const session = this.getOrCreateSession(userId);
    session.step = step;
    
    // Clear data that comes after this step
    const stepOrder = ['service_selection', 'master_selection', 'date_selection', 'time_selection', 'confirmation'];
    const currentStepIndex = stepOrder.indexOf(step);
    
    if (currentStepIndex !== -1) {
      const stepsToClear = stepOrder.slice(currentStepIndex + 1);
      stepsToClear.forEach(stepName => {
        switch (stepName) {
          case 'master_selection':
            session.data.masterId = null;
            break;
          case 'date_selection':
            session.data.date = null;
            break;
          case 'time_selection':
            session.data.time = null;
            break;
          case 'confirmation':
            // Don't clear customer info on confirmation reset
            break;
        }
      });
    }
    
    session.lastActivity = new Date();
    logger.info(`Reset session for user ${userId} to step: ${step}`);
  }
}

// Create singleton instance
const bookingStateService = new BookingStateService();

// Auto-cleanup expired sessions every 5 minutes
setInterval(() => {
  bookingStateService.cleanupExpiredSessions();
}, 5 * 60 * 1000);

module.exports = bookingStateService;