import api from '../services/api.js';

class AppointmentForm {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      mode: 'create', // 'create' or 'edit'
      appointmentId: null,
      ...options
    };
    this.formData = {
      customerId: '',
      masterId: '',
      serviceIds: [],
      startTime: '',
      customerNotes: '',
      status: 'SCHEDULED',
      adminNotes: ''
    };
    this.customers = [];
    this.masters = [];
    this.services = [];
    this.isLoading = false;

    this.render();
    this.loadInitialData();
  }

  render() {
    const title = this.options.mode === 'edit' ? 'Редагувати запис' : 'Створити запис';
    
    this.container.innerHTML = `
      <div class="appointment-form">
        <div class="form-header">
          <h3>${title}</h3>
          <button class="btn btn-outline close-btn" id="closeFormBtn">
            <i class="icon-x"></i>
          </button>
        </div>

        <form id="appointmentFormElement" class="form-content">
          <div class="form-row">
            <div class="form-group">
              <label for="customerId">Клієнт *</label>
              <select id="customerId" name="customerId" required>
                <option value="">Оберіть клієнта</option>
              </select>
              <span class="error-message" id="customerIdError"></span>
            </div>

            <div class="form-group">
              <label for="masterId">Майстер *</label>
              <select id="masterId" name="masterId" required>
                <option value="">Оберіть майстра</option>
              </select>
              <span class="error-message" id="masterIdError"></span>
            </div>
          </div>

          <div class="form-group">
            <label for="serviceIds">Послуги *</label>
            <div class="services-selection" id="servicesSelection">
              <div class="loading-services">Завантаження послуг...</div>
            </div>
            <span class="error-message" id="serviceIdsError"></span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startTime">Дата та час *</label>
              <input 
                type="datetime-local" 
                id="startTime" 
                name="startTime" 
                required
                min="${this.getMinDateTime()}"
              >
              <span class="error-message" id="startTimeError"></span>
            </div>

            ${this.options.mode === 'edit' ? `
              <div class="form-group">
                <label for="status">Статус</label>
                <select id="status" name="status">
                  <option value="SCHEDULED">Заплановано</option>
                  <option value="CONFIRMED">Підтверджено</option>
                  <option value="IN_PROGRESS">В процесі</option>
                  <option value="COMPLETED">Завершено</option>
                  <option value="CANCELLED">Скасовано</option>
                  <option value="NO_SHOW">Не прийшов</option>
                </select>
              </div>
            ` : ''}
          </div>

          <div class="form-group">
            <label for="customerNotes">Нотатки клієнта</label>
            <textarea 
              id="customerNotes" 
              name="customerNotes" 
              rows="3" 
              maxlength="500"
              placeholder="Додаткові побажання клієнта"
            ></textarea>
            <div class="char-count">
              <span id="customerNotesCount">0</span>/500
            </div>
          </div>

          ${this.options.mode === 'edit' ? `
            <div class="form-group">
              <label for="adminNotes">Нотатки адміністратора</label>
              <textarea 
                id="adminNotes" 
                name="adminNotes" 
                rows="3" 
                maxlength="500"
                placeholder="Внутрішні нотатки"
              ></textarea>
              <div class="char-count">
                <span id="adminNotesCount">0</span>/500
              </div>
            </div>
          ` : ''}

          <div class="form-summary" id="formSummary" style="display: none;">
            <h4>Підсумок</h4>
            <div class="summary-row">
              <span>Тривалість:</span>
              <span id="totalDuration">0 хв</span>
            </div>
            <div class="summary-row">
              <span>Загальна вартість:</span>
              <span id="totalPrice">0 грн</span>
            </div>
            <div class="summary-row">
              <span>Час завершення:</span>
              <span id="endTime">-</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" id="submitBtn">
              <span class="btn-text">${this.options.mode === 'edit' ? 'Зберегти зміни' : 'Створити запис'}</span>
              <span class="btn-loader" style="display: none;">Збереження...</span>
            </button>
            <button type="button" class="btn btn-outline" id="cancelBtn">Скасувати</button>
          </div>
        </form>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = document.getElementById('appointmentFormElement');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeBtn = document.getElementById('closeFormBtn');

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Cancel/close buttons
    cancelBtn?.addEventListener('click', () => {
      this.onCancel();
    });

    closeBtn?.addEventListener('click', () => {
      this.onCancel();
    });

    // Master change - update available services
    document.getElementById('masterId')?.addEventListener('change', (e) => {
      this.onMasterChange(e.target.value);
    });

    // Service selection
    this.container.addEventListener('change', (e) => {
      if (e.target.classList.contains('service-checkbox')) {
        this.updateSummary();
      }
    });

    // Date/time change
    document.getElementById('startTime')?.addEventListener('change', () => {
      this.updateSummary();
    });

    // Character counters
    document.getElementById('customerNotes')?.addEventListener('input', (e) => {
      document.getElementById('customerNotesCount').textContent = e.target.value.length;
    });

    document.getElementById('adminNotes')?.addEventListener('input', (e) => {
      document.getElementById('adminNotesCount').textContent = e.target.value.length;
    });

    // Clear errors on input
    form.addEventListener('input', (e) => {
      const errorElement = document.getElementById(`${e.target.name}Error`);
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    });
  }

  async loadInitialData() {
    this.setLoading(true);
    
    try {
      await Promise.all([
        this.loadCustomers(),
        this.loadMasters(),
        this.loadServices()
      ]);

      if (this.options.mode === 'edit' && this.options.appointmentId) {
        await this.loadAppointmentData();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Помилка завантаження даних');
    } finally {
      this.setLoading(false);
    }
  }

  async loadCustomers() {
    try {
      const response = await api.get('/users', { 
        params: { role: 'CUSTOMER', limit: 1000 } 
      });
      
      if (response.success !== false) {
        this.customers = response.data.users || [];
        this.populateCustomerSelect();
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  async loadMasters() {
    try {
      const response = await api.get('/masters');
      
      if (response.success !== false) {
        this.masters = response.data.masters || [];
        this.populateMasterSelect();
      }
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  }

  async loadServices() {
    try {
      const response = await api.get('/services');
      
      if (response.success !== false) {
        this.services = response.data.services || [];
        this.renderServices();
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  async loadAppointmentData() {
    try {
      const response = await api.get(`/appointments/${this.options.appointmentId}`);
      
      if (response.success !== false) {
        const appointment = response.data.appointment;
        this.populateForm(appointment);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      this.showError('Помилка завантаження запису');
    }
  }

  populateCustomerSelect() {
    const select = document.getElementById('customerId');
    if (!select) return;

    select.innerHTML = '<option value="">Оберіть клієнта</option>';
    
    this.customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = `${customer.firstName} ${customer.lastName} (${customer.email || customer.phone})`;
      select.appendChild(option);
    });
  }

  populateMasterSelect() {
    const select = document.getElementById('masterId');
    if (!select) return;

    select.innerHTML = '<option value="">Оберіть майстра</option>';
    
    this.masters.forEach(master => {
      const option = document.createElement('option');
      option.value = master.id;
      option.textContent = `${master.user.firstName} ${master.user.lastName}`;
      option.dataset.specializations = master.specializations.join(',');
      select.appendChild(option);
    });
  }

  renderServices() {
    const container = document.getElementById('servicesSelection');
    if (!container) return;

    if (this.services.length === 0) {
      container.innerHTML = '<p>Послуги не знайдено</p>';
      return;
    }

    const servicesByCategory = this.services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {});

    let html = '';
    
    Object.entries(servicesByCategory).forEach(([category, categoryServices]) => {
      html += `
        <div class="service-category">
          <h5>${category}</h5>
          <div class="service-list">
            ${categoryServices.map(service => `
              <label class="service-item">
                <input 
                  type="checkbox" 
                  class="service-checkbox" 
                  name="serviceIds" 
                  value="${service.id}"
                  data-duration="${service.duration}"
                  data-price="${service.price}"
                >
                <div class="service-info">
                  <div class="service-name">${service.name}</div>
                  <div class="service-details">
                    <span class="duration">${service.duration} хв</span>
                    <span class="price">${service.price} грн</span>
                  </div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  onMasterChange(masterId) {
    // Filter services based on master specializations
    const master = this.masters.find(m => m.id === masterId);
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    
    if (master && master.specializations.length > 0) {
      serviceCheckboxes.forEach(checkbox => {
        const service = this.services.find(s => s.id === checkbox.value);
        if (service) {
          const isSpecialized = master.specializations.includes(service.category);
          checkbox.disabled = !isSpecialized;
          checkbox.closest('.service-item').style.opacity = isSpecialized ? '1' : '0.5';
        }
      });
    } else {
      serviceCheckboxes.forEach(checkbox => {
        checkbox.disabled = false;
        checkbox.closest('.service-item').style.opacity = '1';
      });
    }

    // Clear selected services
    serviceCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    this.updateSummary();
  }

  populateForm(appointment) {
    // Set form values
    document.getElementById('customerId').value = appointment.customerId;
    document.getElementById('masterId').value = appointment.masterId;
    document.getElementById('startTime').value = this.formatDateTimeLocal(appointment.startTime);
    document.getElementById('customerNotes').value = appointment.customerNotes || '';
    
    if (this.options.mode === 'edit') {
      document.getElementById('status').value = appointment.status;
      document.getElementById('adminNotes').value = appointment.adminNotes || '';
    }

    // Select services
    appointment.serviceIds.forEach(serviceId => {
      const checkbox = document.querySelector(`.service-checkbox[value="${serviceId}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });

    // Update character counters
    document.getElementById('customerNotesCount').textContent = (appointment.customerNotes || '').length;
    if (this.options.mode === 'edit') {
      document.getElementById('adminNotesCount').textContent = (appointment.adminNotes || '').length;
    }

    this.updateSummary();
  }

  updateSummary() {
    const selectedServices = Array.from(document.querySelectorAll('.service-checkbox:checked'))
      .map(checkbox => {
        const service = this.services.find(s => s.id === checkbox.value);
        return service || { duration: 0, price: 0 };
      });

    const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
    const totalPrice = selectedServices.reduce((sum, service) => sum + Number(service.price), 0);
    const startTime = document.getElementById('startTime').value;
    
    let endTime = '-';
    if (startTime && totalDuration > 0) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + totalDuration * 60 * 1000);
      endTime = this.formatDateTime(end);
    }

    document.getElementById('totalDuration').textContent = `${totalDuration} хв`;
    document.getElementById('totalPrice').textContent = `${totalPrice} грн`;
    document.getElementById('endTime').textContent = endTime;

    const summaryDiv = document.getElementById('formSummary');
    if (selectedServices.length > 0) {
      summaryDiv.style.display = 'block';
    } else {
      summaryDiv.style.display = 'none';
    }
  }

  async handleSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.setLoading(true);

    try {
      const formData = this.getFormData();
      let response;

      if (this.options.mode === 'edit') {
        response = await api.put(`/appointments/${this.options.appointmentId}`, formData);
      } else {
        response = await api.post('/appointments', formData);
      }

      if (response.success !== false) {
        this.showSuccess(this.options.mode === 'edit' ? 'Запис оновлено' : 'Запис створено');
        this.onSuccess(response.data.appointment);
      } else {
        this.showError(response.error || 'Помилка збереження');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      this.showError('Помилка збереження запису');
    } finally {
      this.setLoading(false);
    }
  }

  validateForm() {
    let isValid = true;
    const errors = {};

    // Customer validation
    const customerId = document.getElementById('customerId').value;
    if (!customerId) {
      errors.customerId = 'Оберіть клієнта';
      isValid = false;
    }

    // Master validation
    const masterId = document.getElementById('masterId').value;
    if (!masterId) {
      errors.masterId = 'Оберіть майстра';
      isValid = false;
    }

    // Services validation
    const selectedServices = document.querySelectorAll('.service-checkbox:checked');
    if (selectedServices.length === 0) {
      errors.serviceIds = 'Оберіть щонайменше одну послугу';
      isValid = false;
    }

    // Date/time validation
    const startTime = document.getElementById('startTime').value;
    if (!startTime) {
      errors.startTime = 'Оберіть дату та час';
      isValid = false;
    } else {
      const startDateTime = new Date(startTime);
      const now = new Date();
      if (startDateTime <= now) {
        errors.startTime = 'Дата та час повинні бути в майбутньому';
        isValid = false;
      }
    }

    // Display errors
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = document.getElementById(`${field}Error`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    });

    return isValid;
  }

  getFormData() {
    const selectedServices = Array.from(document.querySelectorAll('.service-checkbox:checked'))
      .map(checkbox => checkbox.value);

    const formData = {
      customerId: document.getElementById('customerId').value,
      masterId: document.getElementById('masterId').value,
      serviceIds: selectedServices,
      startTime: document.getElementById('startTime').value,
      customerNotes: document.getElementById('customerNotes').value
    };

    if (this.options.mode === 'edit') {
      formData.status = document.getElementById('status').value;
      formData.adminNotes = document.getElementById('adminNotes').value;
    }

    return formData;
  }

  setLoading(loading) {
    this.isLoading = loading;
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    if (submitBtn) {
      submitBtn.disabled = loading;
    }
    
    if (btnText) {
      btnText.style.display = loading ? 'none' : 'inline';
    }
    
    if (btnLoader) {
      btnLoader.style.display = loading ? 'inline' : 'none';
    }
  }

  showError(message) {
    alert(message); // Simple fallback - implement proper toast notifications
  }

  showSuccess(message) {
    alert(message); // Simple fallback - implement proper toast notifications
  }

  // Event handlers (to be overridden by parent)
  onSuccess(appointment) {
    this.container.dispatchEvent(new CustomEvent('appointmentSaved', {
      detail: { appointment }
    }));
  }

  onCancel() {
    this.container.dispatchEvent(new CustomEvent('appointmentCancelled'));
  }

  // Utility methods
  getMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  formatDateTime(date) {
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default AppointmentForm;