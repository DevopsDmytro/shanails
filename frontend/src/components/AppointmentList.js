import api from '../services/api.js';

class AppointmentList {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      editable: true,
      deletable: true,
      showFilters: true,
      ...options
    };
    this.appointments = [];
    this.filters = {
      status: '',
      masterId: '',
      customerId: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 20
    };
    this.pagination = null;
    this.isLoading = false;

    this.render();
    this.loadAppointments();
  }

  render() {
    this.container.innerHTML = `
      <div class="appointment-list">
        <div class="list-header">
          <h3>Записи</h3>
          ${this.options.showFilters ? this.renderFilters() : ''}
          <div class="list-actions">
            <button class="btn btn-primary" id="addAppointmentBtn">
              <i class="icon-plus"></i> Створити запис
            </button>
            <button class="btn btn-secondary" id="refreshBtn">
              <i class="icon-refresh"></i> Оновити
            </button>
          </div>
        </div>

        <div class="loading-overlay" id="loadingOverlay" style="display: none;">
          <div class="spinner"></div>
          <p>Завантаження...</p>
        </div>

        <div class="appointments-container" id="appointmentsContainer">
          ${this.renderEmptyState()}
        </div>

        ${this.renderPagination()}
      </div>
    `;

    this.attachEventListeners();
  }

  renderFilters() {
    return `
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group">
            <label for="statusFilter">Статус</label>
            <select id="statusFilter" name="status">
              <option value="">Всі статуси</option>
              <option value="SCHEDULED">Заплановано</option>
              <option value="CONFIRMED">Підтверджено</option>
              <option value="IN_PROGRESS">В процесі</option>
              <option value="COMPLETED">Завершено</option>
              <option value="CANCELLED">Скасовано</option>
              <option value="NO_SHOW">Не прийшов</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateFromFilter">З дати</label>
            <input type="date" id="dateFromFilter" name="dateFrom">
          </div>

          <div class="filter-group">
            <label for="dateToFilter">По дату</label>
            <input type="date" id="dateToFilter" name="dateTo">
          </div>

          <button class="btn btn-secondary" id="applyFiltersBtn">Застосувати</button>
          <button class="btn btn-outline" id="clearFiltersBtn">Очистити</button>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h4>Записів не знайдено</h4>
        <p>Спробуйте змінити фільтри або створіть новий запис</p>
      </div>
    `;
  }

  renderAppointments() {
    if (!this.appointments.length) {
      return this.renderEmptyState();
    }

    return `
      <div class="appointments-table">
        <div class="table-header">
          <div class="table-cell">Дата та час</div>
          <div class="table-cell">Клієнт</div>
          <div class="table-cell">Майстер</div>
          <div class="table-cell">Послуги</div>
          <div class="table-cell">Ціна</div>
          <div class="table-cell">Статус</div>
          <div class="table-cell">Дії</div>
        </div>
        <div class="table-body">
          ${this.appointments.map(appointment => this.renderAppointmentRow(appointment)).join('')}
        </div>
      </div>
    `;
  }

  renderAppointmentRow(appointment) {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
    const masterName = `${appointment.master.user.firstName} ${appointment.master.user.lastName}`;
    const services = appointment.services.map(s => s.name).join(', ');
    const statusClass = this.getStatusClass(appointment.status);
    const statusText = this.getStatusText(appointment.status);

    return `
      <div class="table-row" data-appointment-id="${appointment.id}">
        <div class="table-cell">
          <div class="appointment-time">
            <div class="date">${this.formatDate(startTime)}</div>
            <div class="time">${this.formatTime(startTime)} - ${this.formatTime(endTime)}</div>
          </div>
        </div>
        <div class="table-cell">
          <div class="customer-info">
            <div class="name">${customerName}</div>
            <div class="contact">${appointment.customer.phone || appointment.customer.email}</div>
          </div>
        </div>
        <div class="table-cell">
          <div class="master-info">
            <div class="name">${masterName}</div>
          </div>
        </div>
        <div class="table-cell">
          <div class="services-info">
            <div class="services">${services}</div>
            <div class="duration">${this.calculateTotalDuration(appointment.services)} хв</div>
          </div>
        </div>
        <div class="table-cell">
          <div class="price">${appointment.totalPrice} грн</div>
        </div>
        <div class="table-cell">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="table-cell">
          <div class="appointment-actions">
            <button class="btn btn-sm btn-outline view-btn" data-id="${appointment.id}">
              <i class="icon-eye"></i>
            </button>
            ${this.options.editable ? `
              <button class="btn btn-sm btn-outline edit-btn" data-id="${appointment.id}">
                <i class="icon-edit"></i>
              </button>
            ` : ''}
            ${this.options.deletable ? `
              <button class="btn btn-sm btn-danger delete-btn" data-id="${appointment.id}">
                <i class="icon-trash"></i>
              </button>
            ` : ''}
            ${appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' ? `
              <button class="btn btn-sm btn-warning no-show-btn" data-id="${appointment.id}">
                Не прийшов
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderPagination() {
    if (!this.pagination || this.pagination.pages <= 1) {
      return '';
    }

    const { page, pages, total } = this.pagination;
    
    return `
      <div class="pagination">
        <div class="pagination-info">
          <span>Сторінка ${page} з ${pages} (${total} записів)</span>
        </div>
        <div class="pagination-controls">
          <button class="btn btn-outline" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
            ←
          </button>
          ${this.generatePageNumbers()}
          <button class="btn btn-outline" ${page >= pages ? 'disabled' : ''} data-page="${page + 1}">
            →
          </button>
        </div>
      </div>
    `;
  }

  generatePageNumbers() {
    const { page, pages } = this.pagination;
    const pagesToShow = [];
    
    // Show current page and 2 pages before/after
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    
    for (let i = start; i <= end; i++) {
      pagesToShow.push(`
        <button class="btn ${i === page ? 'btn-primary' : 'btn-outline'}" data-page="${i}">
          ${i}
        </button>
      `);
    }
    
    return pagesToShow.join('');
  }

  attachEventListeners() {
    // Filter controls
    if (this.options.showFilters) {
      document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
        this.applyFilters();
      });

      document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Action buttons
    document.getElementById('addAppointmentBtn')?.addEventListener('click', () => {
      this.onAddAppointment();
    });

    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      this.loadAppointments();
    });

    // Pagination
    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.page) {
        this.goToPage(parseInt(e.target.dataset.page));
      }
    });

    // Appointment actions
    this.container.addEventListener('click', (e) => {
      const appointmentId = e.target.closest('[data-id]')?.dataset.id;
      
      if (e.target.closest('.view-btn')) {
        this.onViewAppointment(appointmentId);
      } else if (e.target.closest('.edit-btn')) {
        this.onEditAppointment(appointmentId);
      } else if (e.target.closest('.delete-btn')) {
        this.onDeleteAppointment(appointmentId);
      } else if (e.target.closest('.no-show-btn')) {
        this.onMarkNoShow(appointmentId);
      }
    });
  }

  async loadAppointments() {
    this.setLoading(true);
    
    try {
      const response = await api.get('/appointments', { params: this.filters });
      
      if (response.success !== false) {
        this.appointments = response.data.appointments;
        this.pagination = response.data.pagination;
        this.updateAppointmentsDisplay();
      } else {
        this.showError('Помилка завантаження записів: ' + response.error);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showError('Помилка завантаження записів');
    } finally {
      this.setLoading(false);
    }
  }

  applyFilters() {
    this.filters = {
      ...this.filters,
      status: document.getElementById('statusFilter')?.value || '',
      dateFrom: document.getElementById('dateFromFilter')?.value || '',
      dateTo: document.getElementById('dateToFilter')?.value || '',
      page: 1
    };
    
    this.loadAppointments();
  }

  clearFilters() {
    this.filters = {
      status: '',
      masterId: '',
      customerId: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 20
    };

    // Reset form fields
    if (this.options.showFilters) {
      document.getElementById('statusFilter').value = '';
      document.getElementById('dateFromFilter').value = '';
      document.getElementById('dateToFilter').value = '';
    }

    this.loadAppointments();
  }

  goToPage(page) {
    this.filters.page = page;
    this.loadAppointments();
  }

  updateAppointmentsDisplay() {
    const container = document.getElementById('appointmentsContainer');
    if (container) {
      container.innerHTML = this.renderAppointments();
    }
    
    // Update pagination
    const paginationContainer = this.container.querySelector('.pagination');
    if (paginationContainer) {
      paginationContainer.outerHTML = this.renderPagination();
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = loading ? 'flex' : 'none';
    }
  }

  showError(message) {
    // You can implement a toast notification here
    console.error(message);
    alert(message); // Simple fallback
  }

  // Event handlers (to be overridden by parent)
  onAddAppointment() {
    // Emit event or call callback
    this.container.dispatchEvent(new CustomEvent('addAppointment'));
  }

  onViewAppointment(appointmentId) {
    this.container.dispatchEvent(new CustomEvent('viewAppointment', {
      detail: { appointmentId }
    }));
  }

  onEditAppointment(appointmentId) {
    this.container.dispatchEvent(new CustomEvent('editAppointment', {
      detail: { appointmentId }
    }));
  }

  async onDeleteAppointment(appointmentId) {
    if (!confirm('Ви впевнені, що хочете видалити цей запис?')) {
      return;
    }

    try {
      const response = await api.delete(`/appointments/${appointmentId}`);
      
      if (response.success !== false) {
        this.showSuccess('Запис успішно видалено');
        this.loadAppointments();
      } else {
        this.showError('Помилка видалення: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      this.showError('Помилка видалення запису');
    }
  }

  async onMarkNoShow(appointmentId) {
    if (!confirm('Позначити клієнта як такого, що не прийшов?')) {
      return;
    }

    try {
      const response = await api.post(`/appointments/${appointmentId}/no-show`);
      
      if (response.success !== false) {
        this.showSuccess('Запис позначено як "Не прийшов"');
        this.loadAppointments();
      } else {
        this.showError('Помилка: ' + response.error);
      }
    } catch (error) {
      console.error('Error marking no-show:', error);
      this.showError('Помилка оновлення запису');
    }
  }

  showSuccess(message) {
    // You can implement a toast notification here
    console.log(message);
    alert(message); // Simple fallback
  }

  // Utility methods
  formatDate(date) {
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(date) {
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateTotalDuration(services) {
    return services.reduce((total, service) => total + service.duration, 0);
  }

  getStatusClass(status) {
    const statusClasses = {
      'SCHEDULED': 'status-scheduled',
      'CONFIRMED': 'status-confirmed',
      'IN_PROGRESS': 'status-progress',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'NO_SHOW': 'status-no-show'
    };
    return statusClasses[status] || '';
  }

  getStatusText(status) {
    const statusTexts = {
      'SCHEDULED': 'Заплановано',
      'CONFIRMED': 'Підтверджено',
      'IN_PROGRESS': 'В процесі',
      'COMPLETED': 'Завершено',
      'CANCELLED': 'Скасовано',
      'NO_SHOW': 'Не прийшов'
    };
    return statusTexts[status] || status;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default AppointmentList;