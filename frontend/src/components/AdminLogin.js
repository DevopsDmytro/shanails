import api from '../services/api.js';

class AdminLogin {
  constructor(container) {
    this.container = container;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-login">
        <div class="login-card">
          <div class="login-header">
            <h2>Адміністративний вхід</h2>
            <p>Салон краси "Shanails"</p>
          </div>
          
          <form id="adminLoginForm" class="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                placeholder="admin@example.com"
                autocomplete="email"
              >
              <span class="error-message" id="emailError"></span>
            </div>
            
            <div class="form-group">
              <label for="password">Пароль</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                placeholder="Введіть пароль"
                autocomplete="current-password"
              >
              <span class="error-message" id="passwordError"></span>
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">
              <span class="btn-text">Увійти</span>
              <span class="btn-loader" style="display: none;">Завантаження...</span>
            </button>
          </form>
          
          <div class="login-footer">
            <p>Доступ лише для авторизованого персоналу</p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Clear errors on input
    emailInput.addEventListener('input', () => {
      this.clearError('emailError');
    });

    passwordInput.addEventListener('input', () => {
      this.clearError('passwordError');
    });
  }

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');

    // Clear previous errors
    this.clearAllErrors();

    // Basic validation
    if (!this.validateForm(email, password)) {
      return;
    }

    // Show loading state
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.success !== false) {
        // Store auth data
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.user));

        // Show success message
        this.showSuccess('Вхід успішний! Перенаправлення...');

        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.hash = '#/admin/dashboard';
        }, 1000);
      } else {
        this.showError('loginError', response.error || 'Помилка входу');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('loginError', this.getErrorMessage(error));
    } finally {
      // Hide loading state
      loginBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  validateForm(email, password) {
    let isValid = true;

    // Email validation
    if (!email) {
      this.showError('emailError', 'Email обов\'язковий');
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.showError('emailError', 'Введіть коректний email');
      isValid = false;
    }

    // Password validation
    if (!password) {
      this.showError('passwordError', 'Пароль обов\'язковий');
      isValid = false;
    } else if (password.length < 6) {
      this.showError('passwordError', 'Пароль повинен містити щонайменше 6 символів');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    // If it's a general login error, create it
    if (elementId === 'loginError') {
      const form = document.getElementById('adminLoginForm');
      const existingError = form.querySelector('.general-error');
      
      if (!existingError) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'general-error';
        errorDiv.textContent = message;
        form.insertBefore(errorDiv, form.firstChild);
      }
    }
  }

  clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  clearAllErrors() {
    // Clear field errors
    this.clearError('emailError');
    this.clearError('passwordError');

    // Clear general error
    const generalError = this.container.querySelector('.general-error');
    if (generalError) {
      generalError.remove();
    }
  }

  showSuccess(message) {
    const form = document.getElementById('adminLoginForm');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Remove any existing success message
    const existingSuccess = form.querySelector('.success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }
    
    form.insertBefore(successDiv, form.firstChild);
  }

  getErrorMessage(error) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    // Common error scenarios
    if (error.status === 401) {
      return 'Невірний email або пароль';
    }
    
    if (error.status === 403) {
      return 'Доступ заборонено. Потрібні права адміністратора.';
    }
    
    if (error.status >= 500) {
      return 'Помилка сервера. Спробуйте пізніше.';
    }
    
    return 'Помилка входу. Спробуйте ще раз.';
  }

  destroy() {
    // Clean up event listeners and DOM
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default AdminLogin;