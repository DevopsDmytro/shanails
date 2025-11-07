/**
 * Master Selector Component
 * Displays available masters for a specific service
 */

import apiService from '../services/api.js';
import telegramWebApp from '../utils/telegram.js';

class MasterSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      serviceId: options.serviceId || null,
      serviceIds: options.serviceIds || null,
      onMasterSelect: options.onMasterSelect || (() => {}),
      showExperience: options.showExperience !== false,
      showRating: options.showRating === true,
      ...options
    };
    
    this.masters = [];
    this.selectedMaster = null;
    
    this.init();
  }

  async init() {
    this.render();
    if (this.options.serviceId || this.options.serviceIds) {
      await this.loadMasters();
    }
  }

  async loadMasters() {
    try {
      this.showLoading();
      
      let response;
      if (this.options.serviceIds && this.options.serviceIds.length > 0) {
        // For multiple services, we need to get masters for each service and merge them
        const masterPromises = this.options.serviceIds.map(serviceId => 
          apiService.getMastersByService(serviceId)
        );
        const responses = await Promise.all(masterPromises);
        
        // Merge masters and remove duplicates
        const allMasters = responses.flatMap(r => r.data.masters);
        const uniqueMasters = allMasters.filter((master, index, self) =>
          index === self.findIndex(m => m.id === master.id)
        );
        this.masters = uniqueMasters;
      } else if (this.options.serviceId) {
        response = await apiService.getMastersByService(this.options.serviceId);
        this.masters = response.data.masters;
      }
      
      this.hideLoading();
      this.renderMasters();
    } catch (error) {
      this.hideLoading();
      this.showError('Не вдалося завантажити майстрів. Спробуйте ще раз.');
      console.error('Error loading masters:', error);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="master-selector">
        <div class="master-selector__header">
          <h2 class="master-selector__title">👩‍🎨 Оберіть майстра</h2>
          <p class="master-selector__subtitle">Всі наші майстри - професіонали з великим досвідом</p>
        </div>

        <div class="master-selector__content">
          <div class="master-selector__grid" id="masters-grid">
            <!-- Masters will be rendered here -->
          </div>
        </div>

        <div class="master-selector__loading" id="loading" style="display: none;">
          <div class="spinner"></div>
          <p>Завантаження майстрів...</p>
        </div>

        <div class="master-selector__error" id="error" style="display: none;">
          <p class="error-message"></p>
          <button class="retry-btn" onclick="this.loadMasters()">Спробувати ще раз</button>
        </div>

        <div class="master-selector__empty" id="empty" style="display: none;">
          <div class="empty-icon">👩‍🎨</div>
          <h3>Майстрів не знайдено</h3>
          <p>На жаль, зараз немає доступних майстрів для цієї послуги</p>
        </div>
      </div>
    `;
  }

  renderMasters() {
    const mastersGrid = this.container.querySelector('#masters-grid');
    if (!mastersGrid) return;

    if (this.masters.length === 0) {
      this.showEmpty();
      return;
    }

    mastersGrid.innerHTML = this.masters.map(master => `
      <div class="master-card" data-master-id="${master.id}">
        <div class="master-card__avatar">
          <div class="master-card__avatar-placeholder">
            👩‍🎨
          </div>
          ${this.options.showRating ? `
            <div class="master-card__rating">
              ⭐ ${this.getMasterRating(master)}
            </div>
          ` : ''}
        </div>
        
        <div class="master-card__content">
          <h3 class="master-card__name">
            ${master.user.firstName} ${master.user.lastName}
          </h3>
          
          ${this.options.showExperience && master.experience ? `
            <div class="master-card__experience">
              🎓 Досвід: ${master.experience} років
            </div>
          ` : ''}
          
          <div class="master-card__specializations">
            ${master.specializations.map(spec => `
              <span class="specialization-tag">${spec}</span>
            `).join('')}
          </div>

          ${master.schedules && master.schedules.length > 0 ? `
            <div class="master-card__schedule">
              📅 Графік роботи:
              <div class="schedule-info">
                ${this.formatSchedule(master.schedules)}
              </div>
            </div>
          ` : ''}

          ${master._count?.appointments ? `
            <div class="master-card__stats">
              📊 ${master._count.appointments} записів за місяць
            </div>
          ` : ''}
        </div>

        <div class="master-card__action">
          <button class="btn btn--primary">
            Обрати
          </button>
        </div>
      </div>
    `).join('');

    // Add click handlers
    mastersGrid.querySelectorAll('.master-card').forEach(card => {
      card.addEventListener('click', () => {
        const masterId = card.dataset.masterId;
        const master = this.masters.find(m => m.id.toString() === masterId);
        if (master) {
          this.selectMaster(master);
        }
      });
    });
  }

  selectMaster(master) {
    this.selectedMaster = master;
    
    // Update UI to show selection
    const cards = this.container.querySelectorAll('.master-card');
    cards.forEach(card => {
      card.classList.toggle('selected', card.dataset.masterId === master.id.toString());
    });

    // Trigger callback
    this.options.onMasterSelect(master);

    // Haptic feedback if in Telegram
    if (telegramWebApp.isTelegram()) {
      telegramWebApp.webApp.HapticFeedback.selectionChanged();
    }
  }

  getMasterRating(master) {
    // This would come from reviews data in a real implementation
    // For now, return a mock rating based on experience
    if (master.experience >= 5) return '4.9';
    if (master.experience >= 3) return '4.7';
    if (master.experience >= 1) return '4.5';
    return '4.3';
  }

  formatSchedule(schedules) {
    if (!schedules || schedules.length === 0) return 'Графік не вказано';
    
    // Group by day and show time ranges
    const daysOfWeek = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const scheduleMap = {};
    
    schedules.forEach(schedule => {
      if (!schedule.isActive) return;
      
      const dayName = daysOfWeek[schedule.dayOfWeek];
      const startTime = this.formatTime(schedule.startTime);
      const endTime = this.formatTime(schedule.endTime);
      
      if (!scheduleMap[dayName]) {
        scheduleMap[dayName] = [];
      }
      scheduleMap[dayName].push(`${startTime}-${endTime}`);
    });

    return Object.entries(scheduleMap)
      .map(([day, times]) => `${day}: ${times.join(', ')}`)
      .join(' | ');
  }

  formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  setServiceId(serviceId) {
    this.options.serviceId = serviceId;
    this.loadMasters();
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

  showEmpty() {
    const empty = this.container.querySelector('#empty');
    if (empty) {
      empty.style.display = 'flex';
    }
  }

  hideEmpty() {
    const empty = this.container.querySelector('#empty');
    if (empty) {
      empty.style.display = 'none';
    }
  }

  getSelectedMaster() {
    return this.selectedMaster;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default MasterSelector;