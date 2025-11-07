/**
 * Landing Page
 * Main salon landing page with service overview
 */

import apiService from '../services/api.js';

class LandingPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.services = [];
    this.init();
  }

  async init() {
    this.render();
    await this.loadServices();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="landing-page">
        <!-- Header -->
        <header class="header">
          <div class="header-content">
            <div class="logo">
              <h1>💅 Shanails</h1>
              <p>Найкращий салон краси у Києві</p>
            </div>
            <nav class="nav">
              <button class="btn btn--secondary" data-nav="services">
                💅 Послуги
              </button>
              <button class="btn btn--primary" data-nav="booking">
                📅 Записатися
              </button>
              ${this.options.userData ? `
                <button class="btn btn--secondary" data-nav="appointments">
                  📋 Мої записи
                </button>
              ` : ''}
            </nav>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="hero">
          <div class="hero-content">
            <h2>Запишіться на манікюр та педикюр у найкращих майстрів</h2>
            <p>Професійний догляд за нігтями в затишній атмосфері</p>
            <div class="hero-buttons">
              <button class="btn btn--large btn--primary" data-nav="booking">
                📅 Записатися онлайн
              </button>
              <button class="btn btn--large btn--secondary" data-nav="services">
                💅 Дивитися послуги
              </button>
            </div>
          </div>
        </section>

        <!-- Features -->
        <section class="features">
          <div class="container">
            <h2>Чому обирають Shanails?</h2>
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">👩‍🎨</div>
                <h3>Професійні майстри</h3>
                <p>Досвідчені спеціалісти з багаторічним досвідом</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🧼</div>
                <h3>Стерильність</h3>
                <p>Повна дезінфекція інструментів та одноразові матеріали</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">💎</div>
                <h3>Якісні матеріали</h3>
                <p>Використовуємо тільки перевірені матеріали преміум-класу</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">⏰</div>
                <h3>Зручний запис</h3>
                <p>Онлайн запис 24/7 через Telegram або наш сайт</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Popular Services -->
        <section class="popular-services">
          <div class="container">
            <h2>Популярні послуги</h2>
            <div class="services-preview" id="services-preview">
              <div class="loading">Завантаження послуг...</div>
            </div>
            <div class="services-more">
              <button class="btn btn--primary" data-nav="services">
                Всі послуги
              </button>
            </div>
          </div>
        </section>

        <!-- Contact Info -->
        <section class="contact">
          <div class="container">
            <h2>Контакти</h2>
            <div class="contact-info">
              <div class="contact-item">
                <div class="contact-icon">📍</div>
                <div>
                  <h3>Адреса</h3>
                  <p>вул. Хрещатик, 1</p>
                  <p>Київ, 01001</p>
                </div>
              </div>
              <div class="contact-item">
                <div class="contact-icon">📱</div>
                <div>
                  <h3>Телефон</h3>
                  <p>+380 44 123 45 67</p>
                  <p>+380 67 890 12 34</p>
                </div>
              </div>
              <div class="contact-item">
                <div class="contact-icon">🕐</div>
                <div>
                  <h3>Години роботи</h3>
                  <p>Пн-Пт: 09:00 - 19:00</p>
                  <p>Сб: 10:00 - 18:00</p>
                  <p>Нд: 11:00 - 17:00</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
          <div class="container">
            <div class="footer-content">
              <div class="footer-section">
                <h3>Shanails</h3>
                <p>Ваш улюблений салон краси</p>
              </div>
              <div class="footer-section">
                <h4>Швидкі посилання</h4>
                <ul>
                  <li><a href="#" data-nav="services">Послуги</a></li>
                  <li><a href="#" data-nav="booking">Запис</a></li>
                  <li><a href="#" data-nav="appointments">Мої записи</a></li>
                </ul>
              </div>
              <div class="footer-section">
                <h4>Контакти</h4>
                <p>📍 вул. Хрещатик, 1</p>
                <p>📱 +380 44 123 45 67</p>
                <p>✉️ info@shanails.com</p>
              </div>
            </div>
            <div class="footer-bottom">
              <p>&copy; 2024 Shanails. Всі права захищено.</p>
            </div>
          </div>
        </footer>
      </div>
    `;
  }

  async loadServices() {
    try {
      const response = await apiService.getServices({ limit: 6, active: true });
      this.services = response.data.services;
      this.renderServicesPreview();
    } catch (error) {
      console.error('Error loading services:', error);
      document.getElementById('services-preview').innerHTML = `
        <div class="error">Не вдалося завантажити послуги</div>
      `;
    }
  }

  renderServicesPreview() {
    const container = document.getElementById('services-preview');
    
    if (this.services.length === 0) {
      container.innerHTML = '<div class="no-services">Послуги тимчасово недоступні</div>';
      return;
    }

    container.innerHTML = this.services.map(service => `
      <div class="service-card">
        <div class="service-header">
          <h3>${service.name}</h3>
          <span class="service-category">${service.category}</span>
        </div>
        <div class="service-details">
          <p class="service-description">${service.description || 'Професійний догляд за нігтями'}</p>
          <div class="service-meta">
            <span class="service-duration">⏱ ${service.duration} хв</span>
            <span class="service-price">💰 ${service.price} грн</span>
          </div>
        </div>
        <button class="btn btn--primary" data-nav="booking" data-service="${service.id}">
          Записатися
        </button>
      </div>
    `).join('');
  }

  attachEventListeners() {
    // Navigation is handled by main app router
    // Service-specific booking
    this.container.addEventListener('click', (event) => {
      const serviceButton = event.target.closest('[data-service]');
      if (serviceButton) {
        const serviceId = serviceButton.getAttribute('data-service');
        // Store selected service for booking page
        sessionStorage.setItem('selectedServiceId', serviceId);
        this.options.onNavigate('booking');
      }
    });
  }

  destroy() {
    // Cleanup if needed
    this.container.innerHTML = '';
  }
}

export default LandingPage;