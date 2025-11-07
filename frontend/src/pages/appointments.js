/**
 * Appointments Page
 * View and manage user appointments
 */

import apiService from '../services/api.js';
import telegramWebApp from '../utils/telegram.js';

class AppointmentsPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.appointments = [];
    this.init();
  }

  async init() {
    this.render();
    await this.loadAppointments();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="appointments-page">
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-left">
              <button class="btn btn--secondary" onclick="history.back()">
                🔙 Назад
              </button>
              <h1>📋 Мої записи</h1>
            </div>
            <div class="header-right">
              <button class="btn btn--primary" data-nav="booking">
                📅 Новий запис
              </button>
            </div>
          </div>
        </header>

        <!-- Appointments List -->
        <section class="appointments-content">
          <div class="container">
            <div class="appointments-filters">
              <div class="filter-tabs">
                <button class="filter-tab active" data-status="all">
                  Всі записи
                </button>
                <button class="filter-tab" data-status="upcoming">
                  Майбутні
                </button>
                <button class="filter-tab" data-status="completed">
                  Завершені
                </button>
                <button class="filter-tab" data-status="cancelled">
                  Скасовані
                </button>
              </div>
            </div>

            <div class="appointments-list" id="appointments-list">
              <div class="loading">Завантаження записів...</div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="appointments-cta">
          <div class="container">
            <div class="cta-content">
              <h2>Запишіться на новий візит</h2>
              <p>Оберіть зручний час та послугу для наступного відвідування</p>
              <button class="btn btn--large btn--primary" data-nav="booking">
                📅 Записатися зараз
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async loadAppointments() {
    try {
      this.appointments = await apiService.getUserAppointments();
      this.renderAppointments();
    } catch (error) {
      console.error('Error loading appointments:', error);
      document.getElementById('appointments-list').innerHTML = `
        <div class="error">
          <h3>Не вдалося завантажити записи</h3>
          <p>Спробуйте оновити сторінку</p>
          <button class="btn btn--primary" onclick="location.reload()">
            Оновити
          </button>
        </div>
      `;
    }
  }

  renderAppointments(filterStatus = 'all') {
    const list = document.getElementById('appointments-list');
    if (!list) return;

    const filteredAppointments = this.filterAppointments(this.appointments, filterStatus);

    if (filteredAppointments.length === 0) {
      list.innerHTML = `
        <div class="no-appointments">
          <h3>${this.getEmptyMessage(filterStatus)}</h3>
          <p>${this.getEmptySubtext(filterStatus)}</p>
          ${filterStatus === 'all' ? `
            <button class="btn btn--primary" data-nav="booking">
              📅 Записатися
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    list.innerHTML = filteredAppointments.map(appointment => `
      <div class="appointment-card ${appointment.status.toLowerCase()}">
        <div class="appointment-header">
          <div class="appointment-date">
            <div class="date-day">${this.formatDay(appointment.startTime)}</div>
            <div class="date-month">${this.formatMonth(appointment.startTime)}</div>
          </div>
          <div class="appointment-info">
            <h3>${this.formatTime(appointment.startTime)}</h3>
            <p class="appointment-status ${appointment.status.toLowerCase()}">
              ${this.getStatusText(appointment.status)}
            </p>
          </div>
          <div class="appointment-actions">
            ${this.getAppointmentActions(appointment)}
          </div>
        </div>
        
        <div class="appointment-details">
          <div class="appointment-services">
            ${appointment.services.map(service => `
              <div class="service-item">
                <span class="service-name">${service.name}</span>
                <span class="service-price">${service.price} грн</span>
              </div>
            `).join('')}
          </div>
          
          <div class="appointment-meta">
            <div class="meta-item">
              <span class="meta-label">Майстер:</span>
              <span class="meta-value">
                ${appointment.master.user.firstName} ${appointment.master.user.lastName}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Тривалість:</span>
              <span class="meta-value">${this.calculateDuration(appointment.services)} хв</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Загальна вартість:</span>
              <span class="meta-value">${appointment.totalPrice} грн</span>
            </div>
          </div>
          
          ${appointment.customerNotes ? `
            <div class="appointment-notes">
              <strong>Примітки:</strong> ${appointment.customerNotes}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Add method to window for onclick handlers
    window.appointmentsPage = this;
  }

  filterAppointments(appointments, status) {
    const now = new Date();
    
    switch (status) {
      case 'upcoming':
        return appointments.filter(apt => 
          new Date(apt.startTime) > now && 
          ['SCHEDULED', 'CONFIRMED'].includes(apt.status)
        );
      case 'completed':
        return appointments.filter(apt => apt.status === 'COMPLETED');
      case 'cancelled':
        return appointments.filter(apt => ['CANCELLED', 'NO_SHOW'].includes(apt.status));
      default:
        return appointments;
    }
  }

  getEmptyMessage(status) {
    switch (status) {
      case 'upcoming': return 'Майбутніх записів немає';
      case 'completed': return 'Завершених записів немає';
      case 'cancelled': return 'Скасованих записів немає';
      default: return 'Записів немає';
    }
  }

  getEmptySubtext(status) {
    switch (status) {
      case 'upcoming': return 'Запишіться на новий візит';
      case 'completed': return 'Відвідайте наш салон для нових вражень';
      case 'cancelled': return 'Сподіваємось побачити вас найближчим часом';
      default: return 'Запишіться на перший візит до нашого салону';
    }
  }

  getAppointmentActions(appointment) {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const canCancel = appointmentTime > now && ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
    
    let actions = '';
    
    if (canCancel) {
      actions += `
        <button class="btn btn--small btn--secondary" onclick="appointmentsPage.cancelAppointment(${appointment.id})">
          ❌ Скасувати
        </button>
      `;
    }
    
    if (appointment.status === 'COMPLETED' && !appointment.review) {
      actions += `
        <button class="btn btn--small btn--primary" onclick="appointmentsPage.leaveReview(${appointment.id})">
          ⭐ Залишити відгук
        </button>
      `;
    }
    
    return actions;
  }

  async cancelAppointment(appointmentId) {
    if (!confirm('Ви впевнені, що хочете скасувати запис?')) {
      return;
    }

    try {
      await apiService.cancelAppointment(appointmentId);
      await this.loadAppointments(); // Reload appointments
      
      // Show success message
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.showAlert('Запис успішно скасовано');
      } else {
        alert('Запис успішно скасовано');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const message = error.response?.data?.message || 'Не вдалося скасувати запис';
      
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.showAlert(message);
      } else {
        alert(message);
      }
    }
  }

  leaveReview(appointmentId) {
    // Store appointment ID for review page
    sessionStorage.setItem('reviewAppointmentId', appointmentId);
    // Navigate to review (could be a modal or separate page)
    this.showReviewModal(appointmentId);
  }

  showReviewModal(appointmentId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Залишити відгук</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            ✕
          </button>
        </div>
        <div class="modal-content">
          <div class="rating-section">
            <label>Оцінка:</label>
            <div class="rating-stars">
              ${[1,2,3,4,5].map(star => `
                <button class="star-btn" data-rating="${star}" onclick="appointmentsPage.setRating(${star})">
                  ⭐
                </button>
              `).join('')}
            </div>
          </div>
          <div class="comment-section">
            <label>Коментар (необов'язково):</label>
            <textarea id="review-comment" rows="4" placeholder="Поділіться враженнями..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" onclick="this.closest('.modal-overlay').remove()">
            Скасувати
          </button>
          <button class="btn btn--primary" onclick="appointmentsPage.submitReview(${appointmentId})">
            Надіслати відгук
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.selectedRating = 0;
  }

  setRating(rating) {
    this.selectedRating = rating;
    document.querySelectorAll('.star-btn').forEach((btn, index) => {
      btn.style.opacity = index < rating ? '1' : '0.3';
    });
  }

  async submitReview(appointmentId) {
    if (this.selectedRating === 0) {
      alert('Будь ласка, оберіть оцінку');
      return;
    }

    const comment = document.getElementById('review-comment').value;

    try {
      await apiService.createReview(appointmentId, {
        rating: this.selectedRating,
        comment: comment
      });
      
      // Close modal
      document.querySelector('.modal-overlay').remove();
      
      // Reload appointments
      await this.loadAppointments();
      
      // Show success message
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.showAlert('Дякуємо за ваш відгук!');
      } else {
        alert('Дякуємо за ваш відгук!');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const message = error.response?.data?.message || 'Не вдалося надіслати відгук';
      
      if (telegramWebApp.isTelegram()) {
        telegramWebApp.showAlert(message);
      } else {
        alert(message);
      }
    }
  }

  // Utility methods
  formatDay(dateString) {
    return new Date(dateString).getDate();
  }

  formatMonth(dateString) {
    const months = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
    return months[new Date(dateString).getMonth()];
  }

  formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusText(status) {
    const statusMap = {
      'SCHEDULED': 'Заплановано',
      'CONFIRMED': 'Підтверджено',
      'IN_PROGRESS': 'В процесі',
      'COMPLETED': 'Завершено',
      'CANCELLED': 'Скасовано',
      'NO_SHOW': 'Не з\'явився'
    };
    return statusMap[status] || status;
  }

  calculateDuration(services) {
    return services.reduce((total, service) => total + service.duration, 0);
  }

  attachEventListeners() {
    this.container.addEventListener('click', (event) => {
      const statusTab = event.target.closest('.filter-tab');
      if (statusTab) {
        const status = statusTab.getAttribute('data-status');
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
          tab.classList.toggle('active', tab.getAttribute('data-status') === status);
        });
        
        this.renderAppointments(status);
      }
    });
  }

  destroy() {
    this.container.innerHTML = '';
    delete window.appointmentsPage;
  }
}

export default AppointmentsPage;