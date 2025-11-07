/**
 * Services Page
 * Complete list of all available services
 */

import apiService from '../services/api.js';

class ServicesPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.services = [];
    this.categories = [];
    this.selectedCategory = 'all';
    this.init();
  }

  async init() {
    this.render();
    await this.loadData();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="services-page">
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-left">
              <button class="btn btn--secondary" onclick="history.back()">
                🔙 Назад
              </button>
              <h1>💅 Наші послуги</h1>
            </div>
            <div class="header-right">
              <button class="btn btn--primary" data-nav="booking">
                📅 Записатися
              </button>
            </div>
          </div>
        </header>

        <!-- Filters -->
        <section class="services-filters">
          <div class="container">
            <div class="filter-tabs">
              <button class="filter-tab active" data-category="all">
                Всі послуги
              </button>
              ${this.getCategoryTabs()}
            </div>
          </div>
        </section>

        <!-- Services List -->
        <section class="services-content">
          <div class="container">
            <div class="services-grid" id="services-grid">
              <div class="loading">Завантаження послуг...</div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="services-cta">
          <div class="container">
            <div class="cta-content">
              <h2>Готові записатися?</h2>
              <p>Оберіть послугу та зручний час для відвідування</p>
              <button class="btn btn--large btn--primary" data-nav="booking">
                📅 Записатися зараз
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  getCategoryTabs() {
    // This will be populated after loading categories
    return '';
  }

  async loadData() {
    try {
      // Load services and categories in parallel
      const [servicesResponse, categoriesResponse] = await Promise.all([
        apiService.getServices({ active: true }),
        apiService.getServicesCategories()
      ]);
      
      this.services = servicesResponse.data.services;
      this.categories = categoriesResponse.data.categories;
      
      this.renderFilters();
      this.renderServices();
    } catch (error) {
      console.error('Error loading services:', error);
      document.getElementById('services-grid').innerHTML = `
        <div class="error">
          <h3>Не вдалося завантажити послуги</h3>
          <p>Спробуйте оновити сторінку</p>
          <button class="btn btn--primary" onclick="location.reload()">
            Оновити
          </button>
        </div>
      `;
    }
  }

  renderFilters() {
    const filterTabs = document.querySelector('.filter-tabs');
    if (!filterTabs) return;

    const categoryTabs = this.categories.map(category => `
      <button class="filter-tab" data-category="${category}">
        ${category}
      </button>
    `).join('');

    filterTabs.innerHTML = `
      <button class="filter-tab ${this.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
        Всі послуги
      </button>
      ${categoryTabs}
    `;
  }

  renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    const filteredServices = this.selectedCategory === 'all' 
      ? this.services 
      : this.services.filter(service => service.category === this.selectedCategory);

    if (filteredServices.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <h3>Послуги не знайдено</h3>
          <p>У цій категорії тимчасово немає доступних послуг</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredServices.map(service => `
      <div class="service-card">
        <div class="service-header">
          <h3>${service.name}</h3>
          <span class="service-category">${service.category}</span>
        </div>
        <div class="service-details">
          <p class="service-description">
            ${service.description || 'Професійний догляд за нігтями'}
          </p>
          <div class="service-meta">
            <span class="service-duration">⏱ ${service.duration} хв</span>
            <span class="service-price">💰 ${service.price} грн</span>
          </div>
        </div>
        <div class="service-actions">
          <button class="btn btn--primary" data-service="${service.id}">
            Обрати послугу
          </button>
        </div>
      </div>
    `).join('');

    // Add method to window for onclick handlers
    window.servicesPage = this;
  }

  selectService(serviceId) {
    // Store selected service for booking page
    sessionStorage.setItem('selectedServiceId', serviceId);
    this.options.onNavigate('booking');
  }

  filterByCategory(category) {
    this.selectedCategory = category;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-category') === category);
    });
    
    this.renderServices();
  }

  attachEventListeners() {
    this.container.addEventListener('click', (event) => {
      const categoryTab = event.target.closest('.filter-tab');
      if (categoryTab) {
        const category = categoryTab.getAttribute('data-category');
        this.filterByCategory(category);
      }
      
      const serviceButton = event.target.closest('[data-service]');
      if (serviceButton) {
        const serviceId = serviceButton.getAttribute('data-service');
        this.selectService(serviceId);
      }
    });
  }

  destroy() {
    this.container.innerHTML = '';
    delete window.servicesPage;
  }
}

export default ServicesPage;