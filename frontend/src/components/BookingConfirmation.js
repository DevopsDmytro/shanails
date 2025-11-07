/**
 * Booking Confirmation Component
 * Displays booking details and confirms the appointment
 */

import apiService from '../services/api.js';
import telegramWebApp from '../utils/telegram.js';

class BookingConfirmation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      services: options.services || [],
      service: options.service || null, // For backward compatibility
      master: options.master || null,
      date: options.date || null,
      time: options.time || null,
      customerNotes: options.customerNotes || '',
      onConfirm: options.onConfirm || (() => {}),
      onCancel: options.onCancel || (() => {}),
      onBack: options.onBack || (() => {}),
      ...options
    };
    
    this.isSubmitting = false;
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const { services, service, master, date, time } = this.options;
    
    // Use services array if available, otherwise fall back to single service
    const selectedServices = services.length > 0 ? services : (service ? [service] : []);
    
    if (selectedServices.length === 0 || !master || !date || !time) {
      this.container.innerHTML = `
        <div class="booking-confirmation">
          <div class="booking-confirmation__error">
            <div class="error-icon">⚠️</div>
            <h3>Неповна інформація</h3>
            <p>Будь ласка, оберіть послуги, майстра, дату та час</p>
            <button class="btn btn--primary" onclick="history.back()">
              Повернутися
            </button>
          </div>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div class="booking-confirmation">
        <div class="booking-confirmation__header">
          <h2 class="booking-confirmation__title">✅ Підтвердження запису</h2>
          <p class="booking-confirmation__subtitle">Перевірте деталі запису</p>
        </div>

        <div class="booking-confirmation__content">
          <!-- Service Details -->
          <div class="confirmation-section">
            <h3 class="confirmation-section__title">💅 Послуги</h3>
            ${selectedServices.map((svc, index) => `
              <div class="confirmation-card ${index > 0 ? 'confirmation-card--additional' : ''}">
                <div class="confirmation-card__main">
                  <h4 class="confirmation-card__title">${svc.name}</h4>
                  <p class="confirmation-card__category">${svc.category}</p>
                </div>
                <div class="confirmation-card__meta">
                  <div class="meta-item">
                    <span class="meta-label">Тривалість:</span>
                    <span class="meta-value">⏱ ${svc.duration} хв</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Ціна:</span>
                    <span class="meta-value">💰 ${svc.price} грн</span>
                  </div>
                </div>
              </div>
            `).join('')}
            
            <!-- Services Summary -->
            <div class="confirmation-summary">
              <div class="summary-row">
                <span class="summary-label">Загальна тривалість:</span>
                <span class="summary-value">⏱ ${selectedServices.reduce((sum, svc) => sum + svc.duration, 0)} хв</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Загальна вартість:</span>
                <span class="summary-value">💰 ${selectedServices.reduce((sum, svc) => sum + svc.price, 0)} грн</span>
              </div>
            </div>
          </div>

          <!-- Master Details -->
          <div class="confirmation-section">
            <h3 class="confirmation-section__title">👩‍🎨 Майстер</h3>
            <div class="confirmation-card">
              <div class="confirmation-card__main">
                <h4 class="confirmation-card__title">
                  ${master.user.firstName} ${master.user.lastName}
                </h4>
                ${master.experience ? `
                  <p class="confirmation-card__experience">
                    🎓 Досвід: ${master.experience} років
                  </p>
                ` : ''}
              </div>
              ${master.specializations ? `
                <div class="confirmation-card__specializations">
                  ${master.specializations.map(spec => `
                    <span class="specialization-tag">${spec}</span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Date & Time Details -->
          <div class="confirmation-section">
            <h3 class="confirmation-section__title">📅 Дата та час</h3>
            <div class="confirmation-card">
              <div class="confirmation-card__datetime">
                <div class="datetime-item">
                  <span class="datetime-label">📅 Дата:</span>
                  <span class="datetime-value">${this.formatDate(date)}</span>
                </div>
                <div class="datetime-item">
                  <span class="datetime-label">⏰ Час:</span>
                  <span class="datetime-value">${this.formatTime(time)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Notes -->
          <div class="confirmation-section">
            <h3 class="confirmation-section__title">📝 Примітки (необов'язково)</h3>
            <div class="confirmation-card">
              <textarea 
                class="customer-notes-input"
                id="customer-notes"
                placeholder="Вкажіть побажання або особливості запису..."
                maxlength="500"
                rows="3"
              >${this.options.customerNotes}</textarea>
              <div class="character-count">
                <span id="char-count">0</span>/500
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="confirmation-section">
            <div class="booking-summary">
              <div class="summary-row">
                <span class="summary-label">Разом до сплати:</span>
                <span class="summary-value summary-value--total">${selectedServices.reduce((sum, svc) => sum + svc.price, 0)} грн</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Загальна тривалість:</span>
                <span class="summary-value">${selectedServices.reduce((sum, svc) => sum + svc.duration, 0)} хв</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="booking-confirmation__actions">
          <button 
            class="btn btn--secondary btn--large" 
            id="back-btn"
            onclick="this.handleBack()"
          >
            🔙 Назад
          </button>
          
          <button 
            class="btn btn--primary btn--large" 
            id="confirm-btn"
            onclick="this.handleConfirm()"
          >
            ✅ Підтвердити запис
          </button>
        </div>

        <!-- Loading State -->
        <div class="booking-confirmation__loading" id="loading" style="display: none;">
          <div class="spinner"></div>
          <p>Створення запису...</p>
        </div>

        <!-- Error State -->
        <div class="booking-confirmation__error" id="error" style="display: none;">
          <div class="error-content">
            <div class="error-icon">❌</div>
            <h4>Помилка створення запису</h4>
            <p class="error-message"></p>
            <button class="btn btn--primary" onclick="this.hideError()">
              Спробувати ще раз
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Character counter for notes
    const notesInput = this.container.querySelector('#customer-notes');
    const charCount = this.container.querySelector('#char-count');
    
    if (notesInput && charCount) {
      notesInput.addEventListener('input', (e) => {
        const length = e.target.value.length;
        charCount.textContent = length;
        this.options.customerNotes = e.target.value;
      });
    }

    // Action buttons
    const backBtn = this.container.querySelector('#back-btn');
    const confirmBtn = this.container.querySelector('#confirm-btn');
    
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBack());
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleConfirm());
    }
  }

  async handleConfirm() {
    if (this.isSubmitting) return;

    try {
      this.isSubmitting = true;
      this.showLoading();

      // Get customer notes
      const notesInput = this.container.querySelector('#customer-notes');
      const customerNotes = notesInput ? notesInput.value : '';

      // Prepare booking data for booking flow
      const selectedServices = this.options.services.length > 0 ? this.options.services : [this.options.service];
      const bookingData = {
        serviceIds: selectedServices.map(svc => svc.id),
        masterId: this.options.master.id,
        date: this.combineDateTime(this.options.date, this.options.time),
        customerNotes
      };

      // Create appointment using booking flow (supports Telegram auth)
      const response = await apiService.createBookingFlow(bookingData);
      const appointment = response.data.appointment;

      this.hideLoading();
      this.showSuccess(appointment);

      // Trigger callback
      this.options.onConfirm(appointment);

      // Haptic feedback if in Telegram
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.webApp.HapticFeedback.notificationOccurred('success');
      }

    } catch (error) {
      this.isSubmitting = false;
      this.hideLoading();
      this.showError(error.message || 'Не вдалося створити запис. Спробуйте ще раз.');
      console.error('Booking confirmation error:', error);
    }
  }

  handleBack() {
    this.options.onBack();
  }

  showLoading() {
    const loading = this.container.querySelector('#loading');
    const actions = this.container.querySelector('.booking-confirmation__actions');
    
    if (loading) loading.style.display = 'flex';
    if (actions) actions.style.display = 'none';
  }

  hideLoading() {
    const loading = this.container.querySelector('#loading');
    const actions = this.container.querySelector('.booking-confirmation__actions');
    
    if (loading) loading.style.display = 'none';
    if (actions) actions.style.display = 'flex';
  }

  showError(message) {
    const error = this.container.querySelector('#error');
    if (error) {
      error.querySelector('.error-message').textContent = message;
      error.style.display = 'flex';
    }
  }

  hideError() {
    const error = this.container.querySelector('#error');
    if (error) {
      error.style.display = 'none';
    }
  }

  showSuccess(appointment) {
    this.container.innerHTML = `
      <div class="booking-success">
        <div class="success-animation">
          <div class="success-icon">✅</div>
        </div>
        
        <div class="success-content">
          <h2 class="success-title">🎉 Запис успішно створено!</h2>
          <p class="success-message">Ваш запис підтверджено</p>
          
          <div class="success-details">
            <div class="detail-item">
              <span class="detail-label">📅 Дата:</span>
              <span class="detail-value">${this.formatDate(appointment.startTime)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">⏰ Час:</span>
              <span class="detail-value">${this.formatTime(appointment.startTime)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">💅 Послуга:</span>
              <span class="detail-value">${appointment.services[0].name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">👩‍🎨 Майстер:</span>
              <span class="detail-value">
                ${appointment.master.user.firstName} ${appointment.master.user.lastName}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">💰 Ціна:</span>
              <span class="detail-value">${appointment.totalPrice} грн</span>
            </div>
          </div>
          
          <div class="success-info">
            <p>📍 <strong>Адреса:</strong> вул. Хрещатик, 1</p>
            <p>⏰ <strong>Будь ласка, прибудьте за 5 хвилин до початку.</strong></p>
          </div>
          
          <div class="success-actions">
            <button class="btn btn--primary btn--large" onclick="this.handleSuccessAction()">
              🏠 Головне меню
            </button>
          </div>
        </div>
      </div>
    `;
  }

  handleSuccessAction() {
    // This would typically navigate back to main menu
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.sendData({ action: 'back_to_menu' });
    } else {
      window.location.href = '/';
    }
  }

  // Utility methods
  formatDate(date) {
    return new Date(date).toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time) {
    return new Date(time).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  combineDateTime(date, time) {
    const dateObj = new Date(date);
    const timeObj = new Date(time);
    
    dateObj.setHours(
      timeObj.getHours(),
      timeObj.getMinutes(),
      0,
      0
    );
    
    return dateObj.toISOString();
  }

  // Public methods
  updateBookingData(data) {
    Object.assign(this.options, data);
    this.render();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default BookingConfirmation;