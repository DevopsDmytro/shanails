/**
 * Service Browser Component
 * Displays available services with filtering and search capabilities
 */

import apiService from '../services/api.js';
import telegramWebApp from '../utils/telegram.js';

class ServiceBrowser {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onServiceSelect: options.onServiceSelect || (() => {}),
      onServicesChange: options.onServicesChange || (() => {}),
      showCategories: options.showCategories !== false,
      showSearch: options.showSearch !== false,
      showPopular: options.showPopular === true,
      multiSelect: options.multiSelect === true,
      ...options
    };
    
    this.services = [];
    this.categories = [];
    this.selectedCategory = null;
    this.searchQuery = '';
    this.selectedServices = [];
    
    this.init();
  }

  async init() {
    this.render();
    await this.loadData();
  }

  async loadData() {
    try {
      this.showLoading();
      
      // Load categories and services in parallel
      const [categoriesResponse, servicesResponse] = await Promise.all([
        apiService.getServicesCategories(),
        apiService.getServices()
      ]);

      this.categories = categoriesResponse.data.categories;
      this.services = servicesResponse.data.services;
      
      this.hideLoading();
      this.renderServices();
      
      if (this.options.showPopular) {
        this.renderPopularServices();
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Не вдалося завантажити послуги. Спробуйте ще раз.');
      console.error('Error loading services:', error);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="service-browser">
        <div class="service-browser__header">
          <h2 class="service-browser__title">💅 Послуги</h2>
          
          ${this.options.showSearch ? `
            <div class="service-browser__search">
              <input 
                type="text" 
                class="service-browser__search-input" 
                placeholder="Пошук послуг..."
                id="service-search"
              >
              <button class="service-browser__search-btn" id="search-btn">
                🔍
              </button>
            </div>
          ` : ''}
        </div>

        ${this.options.showCategories ? `
          <div class="service-browser__categories" id="categories-container">
            <div class="service-browser__category-tabs">
              <button 
                class="service-browser__category-tab active" 
                data-category="all"
              >
                Всі
              </button>
            </div>
          </div>
        ` : ''}

        ${this.options.showPopular ? `
          <div class="service-browser__popular" id="popular-container">
            <h3 class="service-browser__section-title">🔥 Популярні послуги</h3>
            <div class="service-browser__popular-grid" id="popular-grid">
              <!-- Popular services will be loaded here -->
            </div>
          </div>
        ` : ''}

        <div class="service-browser__content">
          <div class="service-browser__grid" id="services-grid">
            <!-- Services will be rendered here -->
          </div>
        </div>

        <div class="service-browser__loading" id="loading" style="display: none;">
          <div class="spinner"></div>
          <p>Завантаження послуг...</p>
        </div>

        <div class="service-browser__error" id="error" style="display: none;">
          <p class="error-message"></p>
          <button class="retry-btn" onclick="location.reload()">Спробувати ще раз</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('service-search');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.debounceSearch();
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
    }

    // Category tabs
    const categoryTabs = this.container.querySelectorAll('.service-browser__category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.selectCategory(e.target.dataset.category);
      });
    });
  }

  async renderCategories() {
    const categoriesContainer = this.container.querySelector('#categories-container .service-browser__category-tabs');
    if (!categoriesContainer) return;

    const categoriesHTML = [
      '<button class="service-browser__category-tab active" data-category="all">Всі</button>',
      ...this.categories.map(category => `
        <button class="service-browser__category-tab" data-category="${category}">
          💅 ${category}
        </button>
      `)
    ].join('');

    categoriesContainer.innerHTML = categoriesHTML;

    // Re-attach event listeners
    const categoryTabs = categoriesContainer.querySelectorAll('.service-browser__category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.selectCategory(e.target.dataset.category);
      });
    });
  }

  async renderPopularServices() {
    try {
      const response = await apiService.getPopularServices(6);
      const popularServices = response.data.services;
      
      const popularGrid = this.container.querySelector('#popular-grid');
      if (!popularGrid) return;

      popularGrid.innerHTML = popularServices.map(service => `
        <div class="service-card service-card--popular" data-service-id="${service.id}">
          <div class="service-card__image">
            <div class="service-card__icon">💅</div>
          </div>
          <div class="service-card__content">
            <h4 class="service-card__name">${service.name}</h4>
            <p class="service-card__category">${service.category}</p>
            <div class="service-card__meta">
              <span class="service-card__duration">⏱ ${service.duration}хв</span>
              <span class="service-card__price">💰 ${service.price}грн</span>
            </div>
          </div>
        </div>
      `).join('');

      // Add click handlers
      popularGrid.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
          const serviceId = card.dataset.serviceId;
          const service = this.services.find(s => s.id.toString() === serviceId);
          if (service) {
            this.options.onServiceSelect(service);
          }
        });
      });
    } catch (error) {
      console.error('Error loading popular services:', error);
    }
  }

  renderServices() {
    const servicesGrid = this.container.querySelector('#services-grid');
    if (!servicesGrid) return;

    const filteredServices = this.getFilteredServices();

    if (filteredServices.length === 0) {
      servicesGrid.innerHTML = `
        <div class="service-browser__empty">
          <div class="empty-icon">🔍</div>
          <h3>Послуги не знайдено</h3>
          <p>Спробуйте змінити фільтри або пошуковий запит</p>
        </div>
      `;
      return;
    }

servicesGrid.innerHTML = filteredServices.map(service => {
       const isSelected = this.selectedServices.some(s => s.id === service.id);
       return `
       <div class="service-card ${isSelected ? 'service-card--selected' : ''} ${this.options.multiSelect ? 'service-card--multi-select' : ''}" data-service-id="${service.id}">
         <div class="service-card__image">
           <div class="service-card__icon">${this.getServiceIcon(service.category)}</div>
           ${this.options.multiSelect ? `
             <div class="service-card__checkbox">
               <input type="checkbox" ${isSelected ? 'checked' : ''} data-service-id="${service.id}">
             </div>
           ` : ''}
         </div>
         <div class="service-card__content">
           <h3 class="service-card__name">${service.name}</h3>
           <p class="service-card__category">${service.category}</p>
           ${service.description ? `<p class="service-card__description">${service.description}</p>` : ''}
           <div class="service-card__meta">
             <span class="service-card__duration">⏱ ${service.duration}хв</span>
             <span class="service-card__price">💰 ${service.price}грн</span>
           </div>
         </div>
         <div class="service-card__action">
           ${this.options.multiSelect ? '' : `
             <button class="btn btn--primary btn--small">
               Обрати
             </button>
           `}
         </div>
       </div>
     `;
     }).join('');

// Add click handlers
     servicesGrid.querySelectorAll('.service-card').forEach(card => {
       if (this.options.multiSelect) {
         // Handle checkbox changes
         const checkbox = card.querySelector('input[type="checkbox"]');
         if (checkbox) {
           checkbox.addEventListener('change', (e) => {
             const serviceId = parseInt(e.target.dataset.serviceId);
             const service = this.services.find(s => s.id === serviceId);
             if (service) {
               if (e.target.checked) {
                 this.selectedServices.push(service);
               } else {
                 this.selectedServices = this.selectedServices.filter(s => s.id !== serviceId);
               }
               this.updateSelectedServices();
               this.options.onServicesChange(this.selectedServices);
             }
           });
         }
         
         // Also allow clicking on card to toggle checkbox
         card.addEventListener('click', (e) => {
           if (e.target.type !== 'checkbox') {
             const checkbox = card.querySelector('input[type="checkbox"]');
             if (checkbox) {
               checkbox.checked = !checkbox.checked;
               checkbox.dispatchEvent(new Event('change'));
             }
           }
         });
       } else {
         // Single selection mode
         card.addEventListener('click', () => {
           const serviceId = card.dataset.serviceId;
           const service = this.services.find(s => s.id.toString() === serviceId);
           if (service) {
             this.options.onServiceSelect(service);
           }
         });
       }
     });
  }

  getFilteredServices() {
    let filtered = [...this.services];

    // Filter by category
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  async selectCategory(category) {
    this.selectedCategory = category;
    
    // Update active tab
    const tabs = this.container.querySelectorAll('.service-browser__category-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    this.renderServices();
  }

  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  async performSearch() {
    if (!this.searchQuery.trim()) {
      this.renderServices();
      return;
    }

    try {
      this.showLoading();
      const response = await apiService.searchServices(this.searchQuery);
      this.services = response.data.services;
      this.hideLoading();
      this.renderServices();
    } catch (error) {
      this.hideLoading();
      this.showError('Помилка пошуку. Спробуйте ще раз.');
      console.error('Search error:', error);
    }
  }

  getServiceIcon(category) {
    const icons = {
      'Маникюр': '💅',
      'Педикюр': '💅',
      'Наращування': '✨',
      'Покриття': '🎨',
      'Дизайн': '🎨',
      'Ламінування': '💫',
      'Корекція': '✂️'
    };
    return icons[category] || '💅';
  }

  showLoading() {
    const loading = this.container.querySelector('#loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  hideLoading() {
    const loading = this.container.querySelector('#loading');
    if (loading) {
      loading.style.display = 'none';
    }
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

updateSelectedServices() {
    // Update visual state of service cards
     const servicesGrid = this.container.querySelector('#services-grid');
     if (!servicesGrid) return;
     
     servicesGrid.querySelectorAll('.service-card').forEach(card => {
       const serviceId = parseInt(card.dataset.serviceId);
       const isSelected = this.selectedServices.some(s => s.id === serviceId);
       card.classList.toggle('service-card--selected', isSelected);
       
       const checkbox = card.querySelector('input[type="checkbox"]');
       if (checkbox) {
         checkbox.checked = isSelected;
       }
     });
  }

  getSelectedServices() {
    return this.selectedServices;
  }

  getTotalDuration() {
    return this.selectedServices.reduce((total, service) => total + service.duration, 0);
  }

  getTotalPrice() {
    return this.selectedServices.reduce((total, service) => total + Number(service.price), 0);
  }

  destroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.container.innerHTML = '';
  }

  export default ServiceBrowser;