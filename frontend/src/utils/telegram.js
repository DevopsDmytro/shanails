/**
 * Telegram Mini App SDK Integration
 * Provides utilities for working with Telegram WebApp API
 */

class TelegramWebApp {
  constructor() {
    this.webApp = null;
    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize Telegram WebApp
   */
  init() {
    if (window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
      this.isInitialized = true;
      this.setupTheme();
      this.setupBackButton();
      console.log('Telegram WebApp initialized');
    } else {
      console.warn('Telegram WebApp not available');
    }
  }

  /**
   * Check if running in Telegram
   */
  isTelegram() {
    return this.isInitialized;
  }

  /**
   * Setup theme colors
   */
  setupTheme() {
    if (!this.webApp) return;

    const themeParams = this.webApp.themeParams;
    const root = document.documentElement;

    // Apply Telegram theme colors
    if (themeParams.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
      root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
    }
    if (themeParams.hint_color) {
      root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    }
    if (themeParams.link_color) {
      root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
    }
    if (themeParams.button_color) {
      root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
      root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
    }

    // Set dark mode if Telegram is in dark mode
    if (themeParams.bg_color && this.isDarkColor(themeParams.bg_color)) {
      document.body.classList.add('dark-theme');
    }
  }

  /**
   * Setup back button
   */
  setupBackButton() {
    if (!this.webApp) return;

    this.webApp.BackButton.onClick(() => {
      // Emit custom event for components to handle
      window.dispatchEvent(new CustomEvent('telegram-back'));
    });
  }

  /**
   * Show back button
   */
  showBackButton() {
    if (this.webApp) {
      this.webApp.BackButton.show();
    }
  }

  /**
   * Hide back button
   */
  hideBackButton() {
    if (this.webApp) {
      this.webApp.BackButton.hide();
    }
  }

  /**
   * Show main button
   */
  showMainButton(text, onClick) {
    if (!this.webApp) return;

    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.show();
    
    if (onClick) {
      this.webApp.MainButton.onClick(onClick);
    }
  }

  /**
   * Hide main button
   */
  hideMainButton() {
    if (this.webApp) {
      this.webApp.MainButton.hide();
    }
  }

  /**
   * Enable confirmation dialog
   */
  enableConfirmation() {
    if (this.webApp) {
      this.webApp.enableClosingConfirmation();
    }
  }

  /**
   * Disable confirmation dialog
   */
  disableConfirmation() {
    if (this.webApp) {
      this.webApp.disableClosingConfirmation();
    }
  }

  /**
   * Show popup
   */
  showPopup(options) {
    if (!this.webApp) return Promise.resolve();

    return new Promise((resolve) => {
      this.webApp.showPopup(options, resolve);
    });
  }

  /**
   * Show alert
   */
  showAlert(message) {
    if (this.webApp) {
      this.webApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  /**
   * Get user data
   */
  getUser() {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  /**
   * Get init data
   */
  getInitData() {
    return this.webApp?.initData || '';
  }

  /**
   * Send data to bot
   */
  sendData(data) {
    if (this.webApp) {
      this.webApp.sendData(JSON.stringify(data));
    }
  }

  /**
   * Open link
   */
  openLink(url, options = {}) {
    if (this.webApp) {
      if (options.inApp) {
        this.webApp.openLink(url);
      } else {
        this.webApp.openTelegramLink(url);
      }
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Ready state
   */
  ready() {
    if (this.webApp) {
      this.webApp.ready();
    }
  }

  /**
   * Expand webview
   */
  expand() {
    if (this.webApp) {
      this.webApp.expand();
    }
  }

  /**
   * Check if color is dark
   */
  isDarkColor(color) {
    if (!color) return false;
    
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance < 0.5;
  }

  /**
   * Get viewport height
   */
  getViewportHeight() {
    if (this.webApp) {
      return this.webApp.viewportHeight;
    }
    return window.innerHeight;
  }

  /**
   * Get viewport stable height
   */
  getViewportStableHeight() {
    if (this.webApp) {
      return this.webApp.viewportStableHeight;
    }
    return window.innerHeight;
  }

  /**
   * Check if webapp is expanded
   */
  isExpanded() {
    if (this.webApp) {
      return this.webApp.isExpanded;
    }
    return true;
  }
}

// Create singleton instance
const telegramWebApp = new TelegramWebApp();

export default telegramWebApp;