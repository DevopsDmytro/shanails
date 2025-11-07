const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../utils/logger');
const i18n = require('../locales');
const { handleStart, handleHelp, handleBook, handleMyAppointments } = require('./handlers');
const { setupMiddleware } = require('./middleware');
const {
  handleBookingStart,
  handleCategorySelection,
  handleServiceSelection,
  handleMasterSelection,
  handleDateSelection,
  handleTimeSelection,
  handleBookingConfirmation,
  handleUserAppointments,
  handleAppointmentCancellation
} = require('./bookingHandlers');

class ShanailsBot {
  constructor() {
    this.bot = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (!config.telegram.botToken || config.telegram.botToken === 'test-token') {
      logger.warn('Telegram bot token not provided or is test token, bot initialization skipped');
      return;
    }

    // Temporarily disable bot to debug backend startup
    logger.warn('Telegram bot initialization temporarily disabled for debugging');
    return;

    try {
      // Initialize bot with webhook or polling based on environment
      const useWebhook = config.env === 'production' && config.telegram.webhookUrl;
      
      this.bot = useWebhook
        ? new TelegramBot(config.telegram.botToken, { webHook: true })
        : new TelegramBot(config.telegram.botToken, { polling: true });

      // Setup middleware
      setupMiddleware(this.bot);

      // Register command handlers
      this.registerHandlers();

      // Set webhook if in production
      if (useWebhook) {
        await this.bot.setWebHook(config.telegram.webhookUrl);
        logger.info(`Telegram bot webhook set to: ${config.telegram.webhookUrl}`);
      }

      this.isInitialized = true;
      logger.info('Telegram bot initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  registerHandlers() {
    // Command handlers
    this.bot.onText(/\/start/, (msg) => handleStart(this.bot, msg));
    this.bot.onText(/\/help/, (msg) => handleHelp(this.bot, msg));
    this.bot.onText(/\/book/, (msg) => handleBook(this.bot, msg));
    this.bot.onText(/\/myappointments/, (msg) => handleMyAppointments(this.bot, msg));

    // Callback query handlers (for inline keyboards)
    this.bot.on('callback_query', (callbackQuery) => {
      this.handleCallbackQuery(callbackQuery);
    });

    // Message handlers
    this.bot.on('message', (msg) => {
      this.handleMessage(msg);
    });

    // Handle Mini App data
    this.bot.on('web_app_data', (msg) => {
      this.handleWebAppData(msg);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram bot polling error:', error);
    });

    this.bot.on('webhook_error', (error) => {
      logger.error('Telegram bot webhook error:', error);
    });
  }

  async handleCallbackQuery(callbackQuery) {
    const { data, message } = callbackQuery;
    const chatId = message.chat.id;
    const userId = callbackQuery.from.id;

    try {
      // Parse callback data
      const [action, ...params] = data.split(':');

      switch (action) {
        // Booking flow
        case 'book_start':
          await this.openMiniApp(this.bot, chatId, userId, 'booking');
          break;
        case 'category':
          await handleCategorySelection(this.bot, chatId, userId, params[0]);
          break;
        case 'service':
          await handleServiceSelection(this.bot, chatId, userId, params[0]);
          break;
        case 'master':
          await handleMasterSelection(this.bot, chatId, userId, params[0], params[1]);
          break;
        case 'date':
          await handleDateSelection(this.bot, chatId, userId, params[0], params[1], params[2]);
          break;
        case 'time':
          await handleTimeSelection(this.bot, chatId, userId, params[0], params[1], params[2], params[3]);
          break;
        case 'confirm':
          await handleBookingConfirmation(this.bot, chatId, userId, params[0], params[1], params[2], params[3]);
          break;
        case 'my_appointments':
          await this.openMiniApp(this.bot, chatId, userId, 'appointments');
          break;
        case 'cancel_appointment':
          await handleAppointmentCancellation(this.bot, chatId, userId, params[0]);
          break;
        
        // Navigation
        case 'back_to_menu':
          await handleStart(this.bot, message);
          break;
        case 'services_list':
          await this.openMiniApp(this.bot, chatId, userId, 'services');
          break;
        case 'masters_list':
          await this.openMiniApp(this.bot, chatId, userId, 'masters');
          break;
        case 'help_info':
          await handleHelp(this.bot, message);
          break;
        case 'contact_info':
          await this.bot.sendMessage(chatId, 
            '📞 *Контакти*\n\n' +
            '📍 Адреса: вул. Хрещатик, 1\n' +
            '📱 Телефон: +380 44 123 45 67\n' +
            '🕐 Години роботи: 09:00 - 19:00\n' +
            '🌐 Сайт: shanails.com\n\n' +
            'Завжди раді бачити вас!',
            { parse_mode: 'Markdown' }
          );
          break;
          
        // Legacy handlers (for backward compatibility)
        case 'select_service':
          await handleServiceSelection(this.bot, chatId, userId, params[0]);
          break;
        case 'select_master':
          await handleMasterSelection(this.bot, chatId, userId, params[0], params[1]);
          break;
        case 'select_date':
          await handleDateSelection(this.bot, chatId, userId, params[0], params[1], params[2]);
          break;
        case 'select_time':
          await handleTimeSelection(this.bot, chatId, userId, params[0], params[1], params[2], params[3]);
          break;
        case 'confirm_booking':
          await handleBookingConfirmation(this.bot, chatId, userId, params[0], params[1], params[2], params[3]);
          break;
          
        default:
          await this.bot.sendMessage(chatId, 'Невідома команда. Оберіть дію з меню.');
      }

      // Answer callback query to remove loading state
      await this.bot.answerCallbackQuery(callbackQuery.id);

    } catch (error) {
      logger.error('Error handling callback query:', error);
      await this.bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
    }
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Handle text messages that are not commands
    if (text && !text.startsWith('/')) {
      // Handle contact information sharing
      if (msg.contact) {
        await this.handleContactShare(msg);
        return;
      }
      
      // Handle other text input
      await this.bot.sendMessage(chatId, 
        'Будь ласка, використовуйте кнопки меню для навігації.\n\n' +
        'Доступні команди:\n' +
        '/start - головне меню\n' +
        '/help - допомога\n' +
        '/book - запис на послугу\n' +
        '/myappointments - мої записи'
      );
    }
  }

  async handleContactShare(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const contact = msg.contact;

    try {
      // Here you could save the contact information
      // For now, just acknowledge it
      await this.bot.sendMessage(chatId, 
        `Дякуємо! Контактна інформація отримана.\n\n` +
        `Телефон: ${contact.phone_number}\n\n` +
        'Тепер ви можете продовжити запис.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📅 Записатися', callback_data: 'book_start' }
              ],
              [
                { text: '🏠 Головне меню', callback_data: 'back_to_menu' }
              ]
            ]
          }
        }
      );
    } catch (error) {
      logger.error('Error handling contact share:', error);
      await this.bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
    }
  }

  async handleWebAppData(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const data = msg.web_app_data;

    try {
      // Parse data from Mini App
      const parsedData = JSON.parse(data.data);
      
      switch (parsedData.action) {
        case 'booking_confirmed':
          await this.handleBookingConfirmed(chatId, userId, parsedData);
          break;
        case 'appointment_cancelled':
          await this.handleAppointmentCancelled(chatId, userId, parsedData);
          break;
        case 'view_appointments':
          await this.openMiniApp(this.bot, chatId, userId, 'appointments');
          break;
        default:
          logger.warn('Unknown Mini App action:', parsedData.action);
      }
    } catch (error) {
      logger.error('Error handling web app data:', error);
      await this.bot.sendMessage(chatId, 'Виникла помилка при обробці даних. Спробуйте ще раз.');
    }
  }

  async handleBookingConfirmed(chatId, userId, data) {
    try {
      const message = `🎉 *Запис успішно створено!*\n\n` +
        `📅 Дата: ${new Date(data.date).toLocaleDateString('uk-UA')}\n` +
        `⏰ Час: ${data.time}\n` +
        `💅 Послуга: ${data.serviceName}\n` +
        `💰 Ціна: ${data.price} грн\n` +
        `👩‍🎨 Майстер: ${data.masterName}\n` +
        `📍 Адреса: вул. Хрещатик, 1\n\n` +
        'Будь ласка, прибудьте за 5 хвилин до початку.\n\n' +
        'До зустрічі! 💅';

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 Мої записи', callback_data: 'my_appointments' },
              { text: '🏠 Головне меню', callback_data: 'back_to_menu' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error handling booking confirmed:', error);
    }
  }

  async handleAppointmentCancelled(chatId, userId, data) {
    try {
      const message = `✅ *Запис скасовано*\n\n` +
        'Ваш запис успішно скасовано.\n\n' +
        'Хочете записатися на інший час?';

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📅 Записатися', callback_data: 'book_start' }
            ],
            [
              { text: '🏠 Головне меню', callback_data: 'back_to_menu' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error handling appointment cancelled:', error);
    }
  }

  async handleServiceSelection(chatId, serviceId) {
    // Implementation will be added in user story tasks
    await this.bot.sendMessage(chatId, `Обрано послугу: ${serviceId}`);
  }

  async handleMasterSelection(chatId, serviceId, masterId) {
    // Implementation will be added in user story tasks
    await this.bot.sendMessage(chatId, `Обрано майстра: ${masterId} для послуги: ${serviceId}`);
  }

  async handleDateSelection(chatId, serviceId, masterId, date) {
    // Implementation will be added in user story tasks
    await this.bot.sendMessage(chatId, `Обрано дату: ${date}`);
  }

  async handleTimeSelection(chatId, serviceId, masterId, date, time) {
    // Implementation will be added in user story tasks
    await this.bot.sendMessage(chatId, `Обрано час: ${time}`);
  }

  async handleBookingConfirmation(chatId, serviceId, masterId, date, time) {
    // Implementation will be added in user story tasks
    await this.bot.sendMessage(chatId, i18n.t('telegram.bookingConfirmed'));
  }

  async handleAppointmentCancellation(chatId, appointmentId) {
    // Implementation will be added in user story tasks
    await this.bot.sendMessage(chatId, i18n.t('telegram.bookingCancelled'));
  }

  // Mini App integration
  async openMiniApp(bot, chatId, userId, view = 'booking') {
    try {
      // Generate Mini App URL with user data
      const baseUrl = config.env === 'production' 
        ? 'https://shanails.com/booking' 
        : 'https://shanails.local/booking';
      
      // Create user data for Mini App
      const userData = {
        userId: userId.toString(),
        chatId: chatId.toString(),
        view: view,
        timestamp: Date.now()
      };
      
      // Encode user data for Mini App
      const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');
      const miniAppUrl = `${baseUrl}?tgWebAppStartParam=${encodedData}`;
      
      // Send message with Mini App button
      const message = view === 'booking' 
        ? '📅 *Запис на послугу*\n\n' +
          'Натисніть кнопку нижче, щоб відкрити зручний інтерфейс для запису:'
        : '📋 *Мої записи*\n\n' +
          'Натисніть кнопку нижче, щоб переглянути ваші записи:';
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: view === 'booking' ? '📅 Відкрити запис' : '📋 Мої записи', 
                web_app: { url: miniAppUrl }
              }
            ],
            [
              { text: '🏠 Головне меню', callback_data: 'back_to_menu' }
            ]
          ]
        }
      };
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });
      
    } catch (error) {
      logger.error('Error opening Mini App:', error);
      await bot.sendMessage(chatId, 'Виникла помилка при відкритті додатку. Спробуйте ще раз.');
    }
  }

  // Utility methods
  async sendMessage(chatId, text, options = {}) {
    if (!this.isInitialized) {
      logger.warn('Bot not initialized, cannot send message');
      return;
    }

    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(chatId, appointment) {
    const message = `🔔 Нагадування про запис:\n` +
      `📅 Дата: ${appointment.date}\n` +
      `⏰ Час: ${appointment.time}\n` +
      `💅 Послуга: ${appointment.service.name}\n` +
      `👩‍🎨 Майстер: ${appointment.master.name}\n` +
      `📍 Адреса: ${appointment.salon.address}`;

    await this.sendMessage(chatId, message);
  }

  async sendAppointmentConfirmation(chatId, appointment) {
    const message = `✅ Ваш запис підтверджено!\n\n` +
      `📅 Дата: ${appointment.date}\n` +
      `⏰ Час: ${appointment.time}\n` +
      `💅 Послуга: ${appointment.service.name}\n` +
      `👩‍🎨 Майстер: ${appointment.master.name}\n` +
      `💰 Ціна: ${appointment.service.price} грн\n\n` +
      `Будь ласка, прибудьте за 5 хвилин до початку.`;

    await this.sendMessage(chatId, message);
  }

  getBot() {
    return this.bot;
  }

  isReady() {
    return this.isInitialized;
  }
}

// Create and export singleton instance
const bot = new ShanailsBot();

module.exports = bot;