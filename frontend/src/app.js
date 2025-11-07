/**
 * Main Application Router
 * Handles routing between different pages
 */

import LandingPage from './pages/landing.js';
import BookingPage from './pages/booking.js';
import ServicesPage from './pages/services.js';
import AdminPage from './pages/admin.js';
import AppointmentsPage from './pages/appointments.js';
import telegramWebApp from './utils/telegram.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.currentPage = null;
    this.routes = {
      '': LandingPage,
      'booking': BookingPage,
      'services': ServicesPage,
      'admin': AdminPage,
      'appointments': AppointmentsPage
    };
    
    this.init();
  }

  async init() {
    // Setup Telegram WebApp
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.ready();
      telegramWebApp.expand();
    }

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
    
    // Parse Telegram start parameters if available
    if (tgWebAppStartParam) {
      try {
        const userData = JSON.parse(atob(tgWebAppStartParam));
        this.userData = userData;
        console.log('Telegram user data:', userData);
        
        // Route based on view parameter
        if (userData.view) {
          this.navigate(userData.view, { userData });
          return;
        }
      } catch (error) {
        console.error('Error parsing Telegram start parameters:', error);
      }
    }

    // Setup client-side routing
    this.setupRouting();
    
    // Initial route
    const path = window.location.pathname.replace(/^\//, '') || '';
    this.navigate(path);
  }

  setupRouting() {
    // Handle navigation
    window.addEventListener('popstate', (event) => {
      const path = event.state?.path || window.location.pathname.replace(/^\//, '');
      this.navigate(path, false);
    });

    // Handle navigation links
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-nav]');
      if (link) {
        event.preventDefault();
        const path = link.getAttribute('data-nav');
        this.navigate(path);
      }
    });
  }

  async navigate(path, updateHistory = true) {
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }

    // Update URL
    if (updateHistory) {
      history.pushState({ path }, '', `/${path}`);
    }

    // Destroy current page
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }

    // Clear container
    this.container.innerHTML = '';

    // Load new page
    const PageClass = this.routes[path] || this.routes[''];
    
    try {
      this.currentPage = new PageClass(this.container, {
        userData: this.userData,
        onNavigate: (newPath) => this.navigate(newPath)
      });
      
      // Update Telegram main button
      if (telegramWebApp.isTelegram()) {
        this.updateTelegramButton(path);
      }
      
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError('Сторінку не завантажено', 'Спробуйте оновити сторінку');
    }
  }

  updateTelegramButton(path) {
    switch (path) {
      case 'booking':
        telegramWebApp.showMainButton('Продовжити', () => {
          if (this.currentPage && typeof this.currentPage.handleMainButton === 'function') {
            this.currentPage.handleMainButton();
          }
        });
        break;
      case 'admin':
        telegramWebApp.showMainButton('Панель', () => {
          if (this.currentPage && typeof this.currentPage.handleMainButton === 'function') {
            this.currentPage.handleMainButton();
          }
        });
        break;
      default:
        telegramWebApp.hideMainButton();
    }
  }

  showError(title, message) {
    this.container.innerHTML = `
      <div class="error-page">
        <div class="error-content">
          <h1>${title}</h1>
          <p>${message}</p>
          <button class="btn btn--primary" onclick="location.reload()">
            Оновити сторінку
          </button>
        </div>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

export default App;