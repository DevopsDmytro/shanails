const bookingStateService = require('./bookingState');
const bookingService = require('./bookingService');
const i18n = require('../locales');
const logger = require('../utils/logger');

/**
 * Handle booking flow start
 */
const handleBookingStart = async (bot, chatId, userId) => {
  try {
    // Initialize booking session
    bookingStateService.getOrCreateSession(userId);
    
    // Get available services
    const services = await bookingService.getServices();
    const categories = await bookingService.getCategories();
    
    if (services.length === 0) {
      await bot.sendMessage(chatId, 'На жаль, зараз немає доступних послуг. Спробуйте пізніше.');
      return;
    }

    let message = '📅 *Запис на послугу*\n\n';
    message += 'Оберіть категорію послуг:\n\n';

    const keyboard = {
      reply_markup: {
        inline_keyboard: categories.map(category => [
          { text: `💅 ${category}`, callback_data: `category:${category}` }
        ]).concat([
          [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
        ])
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleBookingStart:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

/**
 * Handle category selection
 */
const handleCategorySelection = async (bot, chatId, userId, category) => {
  try {
    // Update session
    bookingStateService.updateSession(userId, {
      step: 'service_selection',
      data: { category }
    });

    // Get services in category
    const services = await bookingService.getServicesByCategory(category);
    
    if (services.length === 0) {
      await bot.sendMessage(chatId, 'У цій категорії немає послуг.');
      return;
    }

    let message = `💅 *${category}*\n\n`;
    message += 'Оберіть послугу:\n\n';

    const keyboard = {
      reply_markup: {
        inline_keyboard: services.map(service => [
          { 
            text: `${service.name} - ${service.price}грн (${service.duration}хв)`, 
            callback_data: `service:${service.id}` 
          }
        ]).concat([
          [{ text: '🔙 Назад', callback_data: 'book_start' }]
        ])
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleCategorySelection:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

/**
 * Handle service selection
 */
const handleServiceSelection = async (bot, chatId, userId, serviceId) => {
  try {
    // Get service details
    const service = await bookingService.getService(serviceId);
    
    // Update session
    bookingStateService.updateSession(userId, {
      step: 'master_selection',
      data: { serviceId, service }
    });

    // Get available masters for this service
    const masters = await bookingService.getMastersForService(serviceId);
    
    if (masters.length === 0) {
      await bot.sendMessage(chatId, 'На жаль, немає доступних майстрів для цієї послуги.');
      return;
    }

    let message = `👩‍🎨 *Оберіть майстра*\n\n`;
    message += `Послуга: ${service.name}\n`;
    message += `Тривалість: ${service.duration} хвилин\n`;
    message += `Ціна: ${service.price} грн\n\n`;
    message += 'Доступні майстри:\n\n';

    const keyboard = {
      reply_markup: {
        inline_keyboard: masters.map(master => [
          { 
            text: `${master.user.firstName} ${master.user.lastName} (${master.experience}р)`, 
            callback_data: `master:${serviceId}:${master.id}` 
          }
        ]).concat([
          [{ text: '🔙 Назад', callback_data: `category:${service.category}` }]
        ])
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleServiceSelection:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

/**
 * Handle master selection
 */
const handleMasterSelection = async (bot, chatId, userId, serviceId, masterId) => {
  try {
    // Get master details
    const master = await bookingService.getMaster(masterId);
    const service = await bookingService.getService(serviceId);
    
    // Update session
    bookingStateService.updateSession(userId, {
      step: 'date_selection',
      data: { masterId, master }
    });

    // Generate available dates
    const availableDates = bookingService.generateAvailableDates();

    let message = `📅 *Оберіть дату*\n\n`;
    message += `Майстер: ${master.user.firstName} ${master.user.lastName}\n`;
    message += `Послуга: ${service.name}\n\n`;
    message += 'Доступні дати:\n\n';

    const keyboard = {
      reply_markup: {
        inline_keyboard: availableDates.map(date => [
          { 
            text: date.label, 
            callback_data: `date:${serviceId}:${masterId}:${date.date}` 
          }
        ]).concat([
          [{ text: '🔙 Назад', callback_data: `service:${serviceId}` }]
        ])
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleMasterSelection:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

/**
 * Handle date selection
 */
const handleDateSelection = async (bot, chatId, userId, serviceId, masterId, date) => {
  try {
    // Get master availability for selected date
    const availability = await bookingService.getMasterAvailability(masterId, date);
    const service = await bookingService.getService(serviceId);
    const master = await bookingService.getMaster(masterId);
    
    // Update session
    bookingStateService.updateSession(userId, {
      step: 'time_selection',
      data: { date }
    });

    // Generate time slots
    const timeSlots = bookingService.generateTimeSlots();

    let message = `⏰ *Оберіть час*\n\n`;
    message += `Дата: ${new Date(date).toLocaleDateString('uk-UA')}\n`;
    message += `Майстер: ${master.user.firstName} ${master.user.lastName}\n`;
    message += `Послуга: ${service.name}\n\n`;
    message += 'Доступні часи:\n\n';

    const keyboard = {
      reply_markup: {
        inline_keyboard: timeSlots.map(time => [
          { 
            text: time, 
            callback_data: `time:${serviceId}:${masterId}:${date}:${time}` 
          }
        ]).concat([
          [{ text: '🔙 Назад', callback_data: `master:${serviceId}:${masterId}` }]
        ])
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleDateSelection:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

/**
 * Handle time selection
 */
const handleTimeSelection = async (bot, chatId, userId, serviceId, masterId, date, time) => {
  try {
    // Check availability
    await bookingService.checkAvailability(masterId, serviceId, date, time);
    
    const service = await bookingService.getService(serviceId);
    const master = await bookingService.getMaster(masterId);
    
    // Update session
    bookingStateService.updateSession(userId, {
      step: 'confirmation',
      data: { time }
    });

    let message = `✅ *Підтвердження запису*\n\n`;
    message += `📅 Дата: ${new Date(date).toLocaleDateString('uk-UA')}\n`;
    message += `⏰ Час: ${time}\n`;
    message += `💅 Послуга: ${service.name}\n`;
    message += `💰 Ціна: ${service.price} грн\n`;
    message += `⏱ Тривалість: ${service.duration} хвилин\n`;
    message += `👩‍🎨 Майстер: ${master.user.firstName} ${master.user.lastName}\n\n`;
    message += 'Підтвердіть запис:';

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Підтвердити', callback_data: `confirm:${serviceId}:${masterId}:${date}:${time}` }
          ],
          [
            { text: '❌ Скасувати', callback_data: 'book_start' }
          ],
          [
            [{ text: '🔙 Назад', callback_data: `date:${serviceId}:${masterId}:${date}` }]
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleTimeSelection:', error);
    await bot.sendMessage(chatId, error.message || 'Виникла помилка. Спробуйте інший час.');
  }
};

/**
 * Handle booking confirmation
 */
const handleBookingConfirmation = async (bot, chatId, userId, serviceId, masterId, date, time) => {
  try {
    const session = bookingStateService.getSession(userId);
    if (!session) {
      await bot.sendMessage(chatId, 'Сесія запису закінчилася. Почніть знову.');
      return;
    }

    // Create booking
    const bookingData = {
      serviceId,
      masterId,
      date,
      time,
      customerInfo: {
        telegramId: userId,
        firstName: session.data.customerInfo.firstName,
        lastName: session.data.customerInfo.lastName,
        phone: session.data.customerInfo.phone
      }
    };

    const booking = await bookingService.createBooking(bookingData);
    
    // Clear session
    bookingStateService.clearSession(userId);

    let message = `🎉 *Запис успішно створено!*\n\n`;
    message += `📅 Дата: ${new Date(date).toLocaleDateString('uk-UA')}\n`;
    message += `⏰ Час: ${time}\n`;
    message += `💅 Послуга: ${booking.service.name}\n`;
    message += `💰 Ціна: ${booking.service.price} грн\n`;
    message += `👩‍🎨 Майстер: ${booking.master.user.firstName} ${booking.master.user.lastName}\n`;
    message += `📍 Адреса: вул. Хрещатик, 1\n\n`;
    message += 'Будь ласка, прибудьте за 5 хвилин до початку.\n\n';
    message += 'До зустрічі! 💅';

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

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleBookingConfirmation:', error);
    await bot.sendMessage(chatId, error.message || 'Не вдалося створити запис. Спробуйте ще раз.');
  }
};

/**
 * Handle user appointments
 */
const handleUserAppointments = async (bot, chatId, userId) => {
  try {
    const appointments = await bookingService.getUserAppointments(userId);
    
    if (appointments.length === 0) {
      let message = '📋 *Ваші записи*\n\n';
      message += 'У вас немає активних записів.\n\n';
      message += 'Хочете записатися?';

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

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });
      return;
    }

    let message = '📋 *Ваші записи*\n\n';
    
    appointments.forEach((appointment, index) => {
      message += `${index + 1}. ${appointment.service.name}\n`;
      message += `📅 ${new Date(appointment.startTime).toLocaleDateString('uk-UA')}\n`;
      message += `⏰ ${new Date(appointment.startTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}\n`;
      message += `👩‍🎨 ${appointment.master.user.firstName} ${appointment.master.user.lastName}\n`;
      message += `💰 ${appointment.service.price} грн\n`;
      message += `Статус: ${getStatusEmoji(appointment.status)} ${getStatusText(appointment.status)}\n\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📅 Новий запис', callback_data: 'book_start' }
          ],
          [
            { text: '🏠 Головне меню', callback_data: 'back_to_menu' }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleUserAppointments:', error);
    await bot.sendMessage(chatId, 'Не вдалося завантажити ваші записи. Спробуйте ще раз.');
  }
};

/**
 * Handle appointment cancellation
 */
const handleAppointmentCancellation = async (bot, chatId, userId, appointmentId) => {
  try {
    await bookingService.cancelAppointment(appointmentId, userId);
    
    const message = '✅ *Запис скасовано*\n\n';
    message += 'Ваш запис успішно скасовано.\n\n';
    message += 'Хочете записатися на інший час?';

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

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error in handleAppointmentCancellation:', error);
    await bot.sendMessage(chatId, error.message || 'Не вдалося скасувати запис. Спробуйте ще раз.');
  }
};

/**
 * Helper functions
 */
function getStatusEmoji(status) {
  switch (status) {
    case 'SCHEDULED': return '📅';
    case 'CONFIRMED': return '✅';
    case 'COMPLETED': return '✨';
    case 'CANCELLED': return '❌';
    default: return '❓';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'SCHEDULED': return 'Заплановано';
    case 'CONFIRMED': return 'Підтверджено';
    case 'COMPLETED': return 'Завершено';
    case 'CANCELLED': return 'Скасовано';
    default: return 'Невідомо';
  }
}

module.exports = {
  handleBookingStart,
  handleCategorySelection,
  handleServiceSelection,
  handleMasterSelection,
  handleDateSelection,
  handleTimeSelection,
  handleBookingConfirmation,
  handleUserAppointments,
  handleAppointmentCancellation
};