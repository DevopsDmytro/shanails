import AdminLogin from '../components/AdminLogin.js';
import AppointmentList from '../components/AppointmentList.js';
import AppointmentForm from '../components/AppointmentForm.js';
import api from '../services/api.js';
import auth from '../utils/auth.js';

class AdminPage {
  constructor(container) {
    this.container = container;
    this.currentUser = null;
    this.currentView = 'dashboard';
    this.components = {};
    
    this.init();
  }

  async init() {
    // Check authentication first
    if (!auth.isAuthenticated()) {
      this.showLogin();
      return;
    }

    // Load current user
    await this.loadCurrentUser();
    
    if (!this.currentUser) {
      this.showLogin();
      return;
    }

    this.renderDashboard();
    this.attachEventListeners();
  }

  showLogin() {
    this.components.login = new AdminLogin(this.container);
    
    // Listen for successful login
    this.container.addEventListener('loginSuccess', () => {
      this.init();
    });
  }

  async loadCurrentUser() {
    try {
      const user = auth.getCurrentUser();
      if (user) {
        this.currentUser = user;
        // Set auth token for API requests
        api.setAuthToken(auth.getToken());
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      auth.logout();
    }
  }

  renderDashboard() {
    this.container.innerHTML = `
      <div class="admin-dashboard">
        <header class="dashboard-header">
          <div class="header-content">
            <div class="logo">
              <h1>Shanails Admin</h1>
              <span>Панель адміністратора</span>
            </div>
            <div class="user-menu">
              <span class="user-name">${this.currentUser.firstName} ${this.currentUser.lastName}</span>
              <button class="btn btn-outline logout-btn" id="logoutBtn">
                <i class="icon-logout"></i> Вийти
              </button>
            </div>
          </div>
        </header>

        <nav class="dashboard-nav">
          <div class="nav-content">
            <button class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
              <i class="icon-dashboard"></i>
              <span>Головна</span>
            </button>
            <button class="nav-item ${this.currentView === 'appointments' ? 'active' : ''}" data-view="appointments">
              <i class="icon-calendar"></i>
              <span>Записи</span>
            </button>
            <button class="nav-item ${this.currentView === 'masters' ? 'active' : ''}" data-view="masters">
              <i class="icon-users"></i>
              <span>Майстри</span>
            </button>
            <button class="nav-item ${this.currentView === 'services' ? 'active' : ''}" data-view="services">
              <i class="icon-services"></i>
              <span>Послуги</span>
            </button>
            <button class="nav-item ${this.currentView === 'customers' ? 'active' : ''}" data-view="customers">
              <i class="icon-customers"></i>
              <span>Клієнти</span>
            </button>
          </div>
        </nav>

        <main class="dashboard-main">
          <div class="main-content" id="mainContent">
            <!-- Content will be rendered here -->
          </div>
        </main>
      </div>
    `;

    this.showCurrentView();
  }

  attachEventListeners() {
    // Navigation
    this.container.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        const view = navItem.dataset.view;
        this.switchView(view);
      }
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    // Appointment form events
    this.container.addEventListener('appointmentSaved', () => {
      if (this.currentView === 'appointments') {
        this.showAppointments();
      }
    });

    this.container.addEventListener('appointmentCancelled', () => {
      if (this.currentView === 'appointments') {
        this.showAppointments();
      }
    });

    this.container.addEventListener('addAppointment', () => {
      this.showAppointmentForm();
    });

    this.container.addEventListener('viewAppointment', (e) => {
      this.viewAppointment(e.detail.appointmentId);
    });

    this.container.addEventListener('editAppointment', (e) => {
      this.editAppointment(e.detail.appointmentId);
    });
  }

  switchView(view) {
    this.currentView = view;
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    this.showCurrentView();
  }

  showCurrentView() {
    const mainContent = document.getElementById('mainContent');
    
    // Clean up existing components
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });

    switch (this.currentView) {
      case 'dashboard':
        this.showDashboard(mainContent);
        break;
      case 'appointments':
        this.showAppointments(mainContent);
        break;
      case 'masters':
        this.showMasters(mainContent);
        break;
      case 'services':
        this.showServices(mainContent);
        break;
      case 'customers':
        this.showCustomers(mainContent);
        break;
      default:
        this.showDashboard(mainContent);
    }
  }

  async showDashboard(container = document.getElementById('mainContent')) {
    container.innerHTML = `
      <div class="dashboard-overview">
        <h2>Огляд системи</h2>
        
        <div class="stats-grid" id="statsGrid">
          <div class="loading-stats">Завантаження статистики...</div>
        </div>

        <div class="dashboard-sections">
          <div class="section">
            <h3>Сьогоднішні записи</h3>
            <div class="today-appointments" id="todayAppointments">
              <div class="loading">Завантаження...</div>
            </div>
          </div>

          <div class="section">
            <h3>Останні активності</h3>
            <div class="recent-activities" id="recentActivities">
              <div class="loading">Завантаження...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadDashboardStats();
    await this.loadTodayAppointments();
  }

  async loadDashboardStats() {
    try {
      const response = await api.get('/admin/analytics/dashboard');
      
      if (response.success !== false) {
        this.renderStats(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      document.getElementById('statsGrid').innerHTML = `
        <div class="error">Помилка завантаження статистики</div>
      `;
    }
  }

  renderStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <div class="stat-number">${stats.totalAppointments || 0}</div>
          <div class="stat-label">Всього записів</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">${stats.appointmentsThisMonth || 0}</div>
          <div class="stat-label">Записів цього місяця</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">${stats.completedAppointments || 0}</div>
          <div class="stat-label">Завершено</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">${stats.totalCustomers || 0}</div>
          <div class="stat-label">Клієнтів</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💇</div>
        <div class="stat-content">
          <div class="stat-number">${stats.totalMasters || 0}</div>
          <div class="stat-label">Майстрів</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💅</div>
        <div class="stat-content">
          <div class="stat-number">${stats.totalServices || 0}</div>
          <div class="stat-label">Послуг</div>
        </div>
      </div>
    `;
  }

  async loadTodayAppointments() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/appointments', {
        params: {
          dateFrom: today,
          dateTo: today,
          limit: 10
        }
      });
      
      if (response.success !== false) {
        this.renderTodayAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Error loading today appointments:', error);
      document.getElementById('todayAppointments').innerHTML = `
        <div class="error">Помилка завантаження записів</div>
      `;
    }
  }

  renderTodayAppointments(appointments) {
    const container = document.getElementById('todayAppointments');
    
    if (appointments.length === 0) {
      container.innerHTML = '<p>На сьогодні записів немає</p>';
      return;
    }

    container.innerHTML = `
      <div class="appointments-list">
        ${appointments.map(appointment => `
          <div class="appointment-item">
            <div class="appointment-time">
              ${new Date(appointment.startTime).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div class="appointment-info">
              <div class="customer">${appointment.customer.firstName} ${appointment.customer.lastName}</div>
              <div class="master">${appointment.master.user.firstName} ${appointment.master.user.lastName}</div>
            </div>
            <div class="appointment-status">
              <span class="status-badge ${this.getStatusClass(appointment.status)}">
                ${this.getStatusText(appointment.status)}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showAppointments(container = document.getElementById('mainContent')) {
    container.innerHTML = `
      <div class="appointments-view">
        <div class="view-header">
          <h2>Управління записами</h2>
        </div>
        <div id="appointmentListContainer"></div>
      </div>
    `;

    this.components.appointmentList = new AppointmentList(
      document.getElementById('appointmentListContainer')
    );
  }

  showAppointmentForm(appointmentId = null) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div class="appointment-form-view">
        <div class="view-header">
          <h2>${appointmentId ? 'Редагувати запис' : 'Створити запис'}</h2>
        </div>
        <div id="appointmentFormContainer"></div>
      </div>
    `;

    this.components.appointmentForm = new AppointmentForm(
      document.getElementById('appointmentFormContainer'),
      {
        mode: appointmentId ? 'edit' : 'create',
        appointmentId: appointmentId
      }
    );
  }

  editAppointment(appointmentId) {
    this.showAppointmentForm(appointmentId);
  }

  viewAppointment(appointmentId) {
    // Implement appointment details view
    console.log('View appointment:', appointmentId);
  }

  showMasters(container = document.getElementById('mainContent')) {
    container.innerHTML = `
      <div class="coming-soon">
        <h2>Управління майстрами</h2>
        <p>Цей розділ знаходиться в розробці</p>
      </div>
    `;
  }

  showServices(container = document.getElementById('mainContent')) {
    container.innerHTML = `
      <div class="coming-soon">
        <h2>Управління послугами</h2>
        <p>Цей розділ знаходиться в розробці</p>
      </div>
    `;
  }

  showCustomers(container = document.getElementById('mainContent')) {
    container.innerHTML = `
      <div class="coming-soon">
        <h2>Управління клієнтами</h2>
        <p>Цей розділ знаходиться в розробці</p>
      </div>
    `;
  }

  handleLogout() {
    auth.logout();
    this.showLogin();
  }

  // Utility methods
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
    // Clean up all components
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });

    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default AdminPage;