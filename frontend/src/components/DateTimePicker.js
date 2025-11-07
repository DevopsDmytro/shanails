/**
 * Date/Time Picker Component
 * Allows users to select date and time for appointments
 */

import apiService from '../services/api.js';
import telegramWebApp from '../utils/telegram.js';

class DateTimePicker {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      masterId: options.masterId || null,
      serviceIds: options.serviceIds || [],
      selectedDate: options.selectedDate || null,
      selectedTime: options.selectedTime || null,
      minDate: options.minDate || new Date(),
      maxDate: options.maxDate || this.getMaxDate(),
      onDateTimeSelect: options.onDateTimeSelect || (() => {}),
      onDateChange: options.onDateChange || (() => {}),
      onTimeChange: options.onTimeChange || (() => {}),
      ...options
    };
    
    this.availableDates = [];
    this.availableTimeSlots = [];
    this.selectedDate = this.options.selectedDate;
    this.selectedTime = this.options.selectedTime;
    
    this.init();
  }

  init() {
    this.render();
    this.generateAvailableDates();
    this.renderDates();
    this.attachEventListeners();
    
    if (this.options.masterId && this.options.serviceIds.length > 0) {
      this.loadTimeSlots();
    }
  }

  getMaxDate() {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate;
  }

  generateAvailableDates() {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip past dates
      if (date < this.options.minDate) continue;
      
      // Skip if beyond max date
      if (date > this.options.maxDate) break;
      
      dates.push({
        date: date,
        label: this.formatDateLabel(date),
        value: this.formatDateValue(date),
        isToday: this.isToday(date),
        isWeekend: this.isWeekend(date)
      });
    }
    
    this.availableDates = dates;
  }

  async loadTimeSlots() {
    if (!this.selectedDate || !this.options.masterId) return;
    
    try {
      this.showTimeLoading();
      
      const formattedDate = this.formatDateValue(this.selectedDate);
      
      const response = await apiService.getMasterAvailability(
        this.options.masterId,
        this.formatDateValue(this.selectedDate),
        this.options.serviceIds
      );
      
      // Handle both response formats:
      // - With serviceIds: response.data.timeSlots (simple array of strings)
      // - Without serviceIds: response.data.availability.timeSlots (array of objects)
      const timeSlots = response.data.timeSlots || response.data.availability?.timeSlots || [];
      
      // Pass the raw time slots data to renderTimeSlots
      this.hideTimeLoading();
      this.renderTimeSlots(timeSlots);
    } catch (error) {
      this.hideTimeLoading();
      this.showTimeError('Не вдалося завантажити доступний час. Спробуйте обрати іншу дату.');
      console.error('Error loading time slots:', error);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="datetime-picker">
        <div class="datetime-picker__header">
          <h2 class="datetime-picker__title">📅 Оберіть дату та час</h2>
          <p class="datetime-picker__subtitle">Виберіть зручний для вас час</p>
        </div>

        <div class="datetime-picker__content">
          <!-- Date Selection -->
          <div class="datetime-picker__section">
            <h3 class="datetime-picker__section-title">📅 Дата</h3>
            <div class="datetime-picker__dates" id="dates-container">
              <!-- Dates will be rendered here -->
            </div>
          </div>

          <!-- Time Selection -->
          <div class="datetime-picker__section">
            <h3 class="datetime-picker__section-title">⏰ Час</h3>
            <div class="datetime-picker__times" id="times-container">
              <div class="datetime-picker__times-placeholder">
                <div class="placeholder-icon">⏰</div>
                <p>Спочатку оберіть дату</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading states -->
        <div class="datetime-picker__time-loading" id="time-loading" style="display: none;">
          <div class="spinner"></div>
          <p>Завантаження доступного часу...</p>
        </div>

        <div class="datetime-picker__time-error" id="time-error" style="display: none;">
          <p class="error-message"></p>
        </div>

        <!-- Selected DateTime Display -->
        <div class="datetime-picker__selected" id="selected-datetime" style="display: none;">
          <div class="selected-datetime__content">
            <h4>📋 Обраний час:</h4>
            <div class="selected-datetime__display">
              <span class="selected-date"></span>
              <span class="selected-time"></span>
            </div>
          </div>
        </div>

        <!-- Confirmation Button -->
        <div class="datetime-picker__confirmation" id="confirmation-container" style="display: none;">
          <button class="confirmation-btn" id="confirm-booking-btn">
            ✅ Підтвердити запис
          </button>
        </div>
      </div>
    `;
  }

  renderDates() {
    const datesContainer = this.container.querySelector('#dates-container');
    if (!datesContainer) return;

    datesContainer.innerHTML = this.availableDates.map(dateInfo => `
      <button 
        class="date-btn ${dateInfo.isToday ? 'date-btn--today' : ''} ${dateInfo.isWeekend ? 'date-btn--weekend' : ''}"
        data-date="${dateInfo.value}"
        data-date-obj='${JSON.stringify(dateInfo.date)}'
      >
        <div class="date-btn__day">${dateInfo.date.getDate()}</div>
        <div class="date-btn__month">${this.getMonthName(dateInfo.date)}</div>
        <div class="date-btn__weekday">${this.getWeekdayName(dateInfo.date)}</div>
        ${dateInfo.isToday ? '<div class="date-btn__today-label">Сьогодні</div>' : ''}
      </button>
    `).join('');
  }

  attachEventListeners() {
    const datesContainer = this.container.querySelector('#dates-container');
    if (!datesContainer) return;

    // Use event delegation - single listener on parent container
    datesContainer.addEventListener('click', this.handleDateClick.bind(this));

    // Also add event delegation for time slots
    const timesContainer = this.container.querySelector('#times-container');
    if (timesContainer) {
      timesContainer.addEventListener('click', this.handleTimeClick.bind(this));
    }

    // Add event delegation for confirmation button
    const confirmBtn = this.container.querySelector('#confirm-booking-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', this.handleConfirmBooking.bind(this));
    }
  }

  handleDateClick(event) {
    const target = event.target.closest('.date-btn');
    if (!target) {
      return; // Click was not on a date button
    }
    
    const dateValue = target.dataset.date;
    const dateObj = new Date(JSON.parse(target.dataset.dateObj));
    this.selectDate(dateObj, dateValue);
  }

  handleTimeClick(event) {
    const target = event.target.closest('.time-btn');
    if (!target) {
      return; // Click was not on a time button
    }
    
    const timeValue = target.dataset.time;
    const timeObj = new Date(JSON.parse(target.dataset.timeObj));
    this.selectTime(timeObj, timeValue);
  }

  renderTimeSlots(timeSlots = []) {
    const timesContainer = this.container.querySelector('#times-container');
    if (!timesContainer) return;

    if (timeSlots.length === 0) {
      timesContainer.innerHTML = `
        <div class="datetime-picker__times-placeholder">
          <div class="placeholder-icon">😔</div>
          <p>На цю дату немає вільного часу</p>
          <p>Спробуйте обрати іншу дату</p>
        </div>
      `;
      return;
    }

    // Store the raw time slots for later use
    this.availableTimeSlots = timeSlots;

    // Handle both string and object formats
    const timeSlotButtons = timeSlots.map(slot => {
      let timeValue, timeObj, duration;
      
      if (typeof slot === 'string') {
        // Simple time string format: "10:00"
        timeValue = slot;
        const [hours, minutes] = slot.split(':');
        timeObj = new Date(this.selectedDate);
        timeObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        duration = 30; // Default duration
      } else {
        // Object format with startTime property
        timeValue = this.formatTimeValue(slot.startTime);
        timeObj = new Date(slot.startTime);
        duration = this.calculateDuration(slot);
      }

      return `
        <button 
          class="time-btn"
          data-time="${timeValue}"
          data-time-obj="${JSON.stringify(timeObj)}"
        >
          <div class="time-btn__time">${this.formatTimeDisplay(timeObj)}</div>
          <div class="time-btn__duration">${duration}хв</div>
        </button>
      `;
    });

    timesContainer.innerHTML = timeSlotButtons.join('');
  }

  selectDate(date, dateValue) {
    this.selectedDate = date;
    
    // Update UI
    const dateButtons = this.container.querySelectorAll('.date-btn');
    dateButtons.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.date === dateValue);
    });

    // Clear previous time selection
    this.selectedTime = null;
    this.clearTimeSelection();

    // Load time slots for new date
    this.loadTimeSlots();

    // Trigger callback
    this.options.onDateChange(date);
  }

  selectTime(time, timeValue) {
    this.selectedTime = time;
    
    // Update UI
    const timeButtons = this.container.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.time === timeValue);
    });

    // Show selected datetime
    this.showSelectedDateTime();

    // Trigger callbacks
    this.options.onTimeChange(time);
    this.options.onDateTimeSelect(this.selectedDate, this.selectedTime);

    // Haptic feedback if in Telegram
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.webApp.HapticFeedback.selectionChanged();
    }
  }

  showSelectedDateTime() {
    const selectedContainer = this.container.querySelector('#selected-datetime');
    if (!selectedContainer) return;

    selectedContainer.style.display = 'block';
    selectedContainer.querySelector('.selected-date').textContent = 
      this.formatDateDisplay(this.selectedDate);
    selectedContainer.querySelector('.selected-time').textContent = 
      this.formatTimeDisplay(this.selectedTime);

    // Show confirmation button
    const confirmationContainer = this.container.querySelector('#confirmation-container');
    if (confirmationContainer) {
      confirmationContainer.style.display = 'block';
    }
  }

  clearTimeSelection() {
    const timesContainer = this.container.querySelector('#times-container');
    if (timesContainer) {
      timesContainer.innerHTML = `
        <div class="datetime-picker__times-placeholder">
          <div class="placeholder-icon">⏰</div>
          <p>Завантаження доступного часу...</p>
        </div>
      `;
    }

    const selectedContainer = this.container.querySelector('#selected-datetime');
    if (selectedContainer) {
      selectedContainer.style.display = 'none';
    }

    // Hide confirmation button
    const confirmationContainer = this.container.querySelector('#confirmation-container');
    if (confirmationContainer) {
      confirmationContainer.style.display = 'none';
    }
  }

  // Utility methods
  formatDateLabel(date) {
    return date.toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'short' 
    });
  }

  formatDateValue(date) {
    return date.toISOString().split('T')[0];
  }

  formatDateDisplay(date) {
    return date.toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTimeValue(date) {
    return date.toTimeString().slice(0, 5);
  }

  formatTimeDisplay(date) {
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMonthName(date) {
    return date.toLocaleDateString('uk-UA', { month: 'short' });
  }

  getWeekdayName(date) {
    return date.toLocaleDateString('uk-UA', { weekday: 'short' });
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  calculateDuration(slot) {
    if (!slot.endTime) return 30; // Default 30 minutes
    const duration = (new Date(slot.endTime) - new Date(slot.startTime)) / (1000 * 60);
    return Math.round(duration);
  }

  // Loading and error states
  showTimeLoading() {
    const loading = this.container.querySelector('#time-loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  hideTimeLoading() {
    const loading = this.container.querySelector('#time-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showTimeError(message) {
    const error = this.container.querySelector('#time-error');
    if (error) {
      error.querySelector('.error-message').textContent = message;
      error.style.display = 'block';
    }
  }

  hideTimeError() {
    const error = this.container.querySelector('#time-error');
    if (error) {
      error.style.display = 'none';
    }
  }

  // Public methods
  setMasterId(masterId) {
    this.options.masterId = masterId;
    if (this.selectedDate) {
      this.loadTimeSlots();
    }
  }

  setServiceIds(serviceIds) {
    this.options.serviceIds = serviceIds;
    if (this.selectedDate) {
      this.loadTimeSlots();
    }
  }

  async handleConfirmBooking() {
    if (!this.selectedDate || !this.selectedTime || !this.options.masterId || this.options.serviceIds.length === 0) {
      console.error('Missing required booking data');
      return;
    }

    try {
      // Combine date and time to create appointment datetime
      const appointmentDateTime = new Date(this.selectedDate);
      appointmentDateTime.setHours(this.selectedTime.getHours(), this.selectedTime.getMinutes(), 0, 0);

      const bookingData = {
        masterId: parseInt(this.options.masterId),
        serviceIds: this.options.serviceIds.map(id => parseInt(id)),
        startTime: appointmentDateTime.toISOString()
      };

      const response = await apiService.createAppointment(bookingData);
      
      // Trigger success callback if provided
      if (this.options.onBookingSuccess) {
        this.options.onBookingSuccess(response.data);
      }

      // Haptic feedback if in Telegram
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.webApp.HapticFeedback.notificationOccurred('success');
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Trigger error callback if provided
      if (this.options.onBookingError) {
        this.options.onBookingError(error);
      }

      // Haptic feedback if in Telegram
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.webApp.HapticFeedback.notificationOccurred('error');
      }
    }
  }

  getSelectedDateTime() {
    return {
      date: this.selectedDate,
      time: this.selectedTime
    };
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default DateTimePicker;