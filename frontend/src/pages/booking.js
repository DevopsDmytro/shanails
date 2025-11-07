/**
 * Main Booking Page
 * Orchestrates the entire booking flow
 */

import ServiceBrowser from '../components/ServiceBrowser.js';
import MasterSelector from '../components/MasterSelector.js';
import DateTimePicker from '../components/DateTimePicker.js';
import BookingConfirmation from '../components/BookingConfirmation.js';
import apiService from '../services/api.js';
import telegramWebApp from '../utils/telegram.js';

class BookingPage {
  constructor() {
    this.container = document.getElementById('app');
    this.currentStep = 'service';
    this.bookingData = {
      services: [],
      master: null,
      date: null,
      time: null
    };
    
    this.components = {};
    this.init();
  }

  async init() {
    // Setup Telegram WebApp
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.showMainButton('Продовжити', () => this.handleMainButton());
      telegramWebApp.enableConfirmation();
    }

    // Initialize page
    this.render();
    this.attachEventListeners();
    
    // Start with service selection
    this.showServiceSelection();
  }

  render() {
    this.container.innerHTML = `
      <div class="booking-page">
        <!-- Progress Indicator -->
        <div class="booking-progress">
          <div class="progress-steps">
            <div class="progress-step" data-step="service">
              <div class="step-number">1</div>
              <div class="step-label">Послуга</div>
            </div>
            <div class="progress-step" data-step="master">
              <div class="step-number">2</div>
              <div class="step-label">Майстер</div>
            </div>
            <div class="progress-step" data-step="datetime">
              <div class="step-number">3</div>
              <div class="step-label">Дата та час</div>
            </div>
            <div class="progress-step" data-step="completed">
              <div class="step-number">✓</div>
              <div class="step-label">Завершено</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
        </div>

        <!-- Content Container -->
        <div class="booking-content" id="booking-content">
          <!-- Dynamic content will be loaded here -->
        </div>

        <!-- Navigation -->
        <div class="booking-navigation">
          <button class="btn btn--secondary" id="back-btn" style="display: none;">
            🔙 Назад
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBack());
    }

    // Telegram back button
    window.addEventListener('telegram-back', () => this.handleBack());
  }

  attachServiceSelectionListeners() {
    // Clear services button
    const clearBtn = document.getElementById('clear-services-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.bookingData.services = [];
        this.components.serviceBrowser.selectedServices = [];
        this.components.serviceBrowser.updateSelectedServices();
        this.updateServicesSummary();
      });
    }

    // Continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        if (this.bookingData.services.length > 0) {
          this.cleanupCurrentComponent();
          this.showMasterSelection();
        }
      });
    }
  }

  // Step Management
  showServiceSelection() {
    this.currentStep = 'service';
    this.updateProgress();
    this.hideBackButton();
    
    const content = document.getElementById('booking-content');
    content.innerHTML = `
      <div class="service-selection">
        <div class="service-selection__header">
          <h2>💅 Оберіть послуги</h2>
          <p>Ви можете обрати одну або кілька послуг (максимум 2 години)</p>
        </div>
        <div class="service-selection__content" id="services-container">
          <!-- Services will be loaded here -->
        </div>
        <div class="service-selection__summary" id="services-summary">
          <div class="summary-card">
            <h3>📋 Обрані послуги</h3>
            <div id="selected-services-list"></div>
            <div class="summary-totals">
              <div class="total-duration">
                <span>Загальна тривалість:</span>
                <span id="total-duration" class="duration-value">0 хв</span>
              </div>
              <div class="total-price">
                <span>Загальна вартість:</span>
                <span id="total-price" class="price-value">0 грн</span>
              </div>
            </div>
            <div id="duration-warning" class="duration-warning" style="display: none;">
              <span class="warning-icon">⚠️</span>
              <span class="warning-text">Загальна тривалість послуг не може перевищувати 2 години.</span>
            </div>
            <div class="summary-actions">
              <button class="btn btn--secondary" id="clear-services-btn">
                Очистити вибір
              </button>
              <button class="btn btn--primary" id="continue-btn" disabled>
                Продовжити
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.components.serviceBrowser = new ServiceBrowser(
      document.getElementById('services-container'),
      {
        multiSelect: true,
        onServicesChange: (services) => this.handleServicesChange(services)
      }
    );
    
    this.attachServiceSelectionListeners();
  }

  showMasterSelection() {
    this.currentStep = 'master';
    this.updateProgress();
    this.showBackButton();
    
    const content = document.getElementById('booking-content');
    this.components.masterSelector = new MasterSelector(content, {
      serviceIds: this.bookingData.services.map(s => s.id),
      onMasterSelect: (master) => this.handleMasterSelect(master)
    });
  }

  showDateTimeSelection() {
    this.currentStep = 'datetime';
    this.updateProgress();
    this.showBackButton();
    
    const content = document.getElementById('booking-content');
    this.components.dateTimePicker = new DateTimePicker(content, {
      masterId: this.bookingData.master.id,
      serviceIds: this.bookingData.services.map(s => s.id),
      onDateTimeSelect: (date, time) => this.handleDateTimeSelect(date, time),
      onBookingSuccess: (response) => this.handleBookingSuccess(response),
      onBookingError: (error) => this.handleBookingError(error)
    });
  }

  showConfirmation() {
    this.currentStep = 'confirmation';
    this.updateProgress();
    this.showBackButton();
    
    const content = document.getElementById('booking-content');
    this.components.bookingConfirmation = new BookingConfirmation(content, {
      services: this.bookingData.services,
      master: this.bookingData.master,
      date: this.bookingData.date,
      time: this.bookingData.time,
      onConfirm: (appointment) => this.handleBookingConfirm(appointment),
      onCancel: () => this.handleBookingCancel(),
      onBack: () => this.handleBack()
    });
  }

  // Event Handlers
  handleServicesChange(services) {
    this.bookingData.services = services;
    this.updateServicesSummary();
    
    // Haptic feedback
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.webApp.HapticFeedback.selectionChanged();
    }
  }

  updateServicesSummary() {
    const selectedList = document.getElementById('selected-services-list');
    const totalDuration = document.getElementById('total-duration');
    const totalPrice = document.getElementById('total-price');
    const durationWarning = document.getElementById('duration-warning');
    const continueBtn = document.getElementById('continue-btn');
    
    if (!selectedList || !totalDuration || !totalPrice || !continueBtn) return;
    
    const services = this.bookingData.services;
    
    // Update selected services list
    if (services.length === 0) {
      selectedList.innerHTML = '<p class="no-services">Послуги не обрано</p>';
    } else {
      selectedList.innerHTML = services.map(service => `
        <div class="selected-service-item">
          <span class="service-name">${service.name}</span>
          <span class="service-details">${service.duration} хв • ${service.price} грн</span>
        </div>
      `).join('');
    }
    
    // Calculate totals
    const duration = services.reduce((sum, service) => sum + service.duration, 0);
    const price = services.reduce((sum, service) => sum + service.price, 0);
    
    // Update totals display
    totalDuration.textContent = `${duration} хв`;
    totalDuration.className = duration > 120 ? 'duration-value warning' : 'duration-value';
    
    totalPrice.textContent = `${price} грн`;
    
    // Show/hide duration warning
    if (duration > 120) {
      durationWarning.style.display = 'flex';
      continueBtn.disabled = true;
    } else {
      durationWarning.style.display = 'none';
      continueBtn.disabled = services.length === 0;
    }
  }

  handleServiceSelect(service) {
    // For backward compatibility - convert single service to array
    this.bookingData.services = [service];
    this.updateServicesSummary();
    
    // Haptic feedback
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.webApp.HapticFeedback.selectionChanged();
    }
    
    // Navigate to master selection
    this.cleanupCurrentComponent();
    this.showMasterSelection();
  }

  handleMasterSelect(master) {
    this.bookingData.master = master;
    
    // Haptic feedback
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.webApp.HapticFeedback.selectionChanged();
    }
    
    // Navigate to date/time selection
    this.cleanupCurrentComponent();
    this.showDateTimeSelection();
  }

  handleDateTimeSelect(date, time) {
    this.bookingData.date = date;
    this.bookingData.time = time;
    
    // Haptic feedback
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.webApp.HapticFeedback.selectionChanged();
    }
    
    // Don't navigate to confirmation - DateTimePicker now handles booking
    // Update progress to show we're ready for confirmation
    this.updateProgress();
  }

  handleBookingSuccess(response) {
    console.log('Booking successful:', response);
    
    // Show success message
    this.showSuccessMessage();
    
    // Update Telegram main button
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.hideMainButton();
      telegramWebApp.sendData({ 
        action: 'booking_confirmed',
        appointmentId: response.data.appointment.id 
      });
    }
  }

  handleBookingError(error) {
    console.error('Booking failed:', error);
    
    // Show error message but keep user on current step
    this.showErrorMessage(error.message);
  }

  showSuccessMessage() {
    const content = document.getElementById('booking-content');
    const services = this.bookingData.services;
    const serviceNames = services.map(s => s.name).join(', ');
    
    content.innerHTML = `
      <div class="booking-success">
        <div class="success-icon">🎉</div>
        <h2>Запис успішно створено!</h2>
        <p>Ваш запис підтверджено. Ми чекаємо на вас!</p>
        <div class="booking-details">
          <p><strong>Послуги:</strong> ${serviceNames}</p>
          <p><strong>Майстер:</strong> ${this.bookingData.master.user?.firstName} ${this.bookingData.master.user?.lastName}</p>
          <p><strong>Дата:</strong> ${this.bookingData.date.toLocaleDateString('uk-UA')}</p>
          <p><strong>Час:</strong> ${this.bookingData.time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button class="btn btn--primary" onclick="location.reload()">
          Створити новий запис
        </button>
      </div>
    `;
  }

  showErrorMessage(message) {
    // Create error toast or alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
      <div class="error-content">
        <strong>❌ Помилка</strong>
        <p>${message}</p>
        <button onclick="this.parentElement.parentElement.remove()">Закрити</button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  handleBookingConfirm(appointment) {
    console.log('Booking confirmed:', appointment);
    
    // Update Telegram main button
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.hideMainButton();
      telegramWebApp.sendData({ 
        action: 'booking_confirmed',
        appointmentId: appointment.id 
      });
    }
  }

  handleBookingCancel() {
    this.handleBack();
  }

  handleBack() {
    // Navigate back based on current step
    switch (this.currentStep) {
      case 'master':
        this.cleanupCurrentComponent();
        this.showServiceSelection();
        break;
      case 'datetime':
        this.cleanupCurrentComponent();
        this.showMasterSelection();
        break;
      case 'confirmation':
        this.cleanupCurrentComponent();
        this.showDateTimeSelection();
        break;
    }
  }

  handleMainButton() {
    // Handle Telegram main button click
    if (telegramWebApp.isTelegram()) {
      switch (this.currentStep) {
        case 'service':
          // Auto-select first service if available
          if (this.components.serviceBrowser?.services?.length > 0) {
            this.handleServiceSelect(this.components.serviceBrowser.services[0]);
          }
          break;
        case 'master':
          // Auto-select first master if available
          if (this.components.masterSelector?.masters?.length > 0) {
            this.handleMasterSelect(this.components.masterSelector.masters[0]);
          }
          break;
        case 'datetime':
          // Trigger booking confirmation if date and time are selected
          const dateTime = this.components.dateTimePicker?.getSelectedDateTime();
          if (dateTime.date && dateTime.time) {
            // Trigger the confirm button click
            const confirmBtn = document.querySelector('#confirm-booking-btn');
            if (confirmBtn) {
              confirmBtn.click();
            }
          }
          break;
        case 'completed':
          // Start new booking
          location.reload();
          break;
      }
    }
  }

  // UI Management
  updateProgress() {
    const steps = ['service', 'master', 'datetime', 'completed'];
    const currentIndex = steps.indexOf(this.currentStep);
    
    // Update step indicators
    steps.forEach((step, index) => {
      const stepElement = document.querySelector(`[data-step="${step}"]`);
      if (stepElement) {
        stepElement.classList.toggle('active', index <= currentIndex);
        stepElement.classList.toggle('completed', index < currentIndex);
      }
    });
    
    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      const progress = ((currentIndex + 1) / steps.length) * 100;
      progressFill.style.width = `${progress}%`;
    }
    
    // Update Telegram main button
    if (telegramWebApp.isTelegram()) {
      const buttonText = this.getMainButtonText();
      telegramWebApp.showMainButton(buttonText, () => this.handleMainButton());
    }
  }

  getMainButtonText() {
    switch (this.currentStep) {
      case 'service': return 'Обрати послугу';
      case 'master': return 'Обрати майстра';
      case 'datetime': return 'Підтвердити запис';
      case 'completed': return 'Створити новий запис';
      default: return 'Продовжити';
    }
  }

  showBackButton() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.style.display = 'block';
    }
    
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.showBackButton();
    }
  }

  hideBackButton() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.style.display = 'none';
    }
    
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.hideBackButton();
    }
  }

  cleanupCurrentComponent() {
    const content = document.getElementById('booking-content');
    if (content) {
      content.innerHTML = '';
    }
    
    // Destroy current component if it exists
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    this.components = {};
  }

  // Public methods
  reset() {
    this.bookingData = {
      services: [],
      master: null,
      date: null,
      time: null
    };
    this.currentStep = 'service';
    this.cleanupCurrentComponent();
    this.showServiceSelection();
  }

  destroy() {
    this.cleanupCurrentComponent();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Initialize booking page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BookingPage();
});

export default BookingPage;