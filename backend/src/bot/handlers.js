const i18n = require('../locales');
const logger = require('../utils/logger');

const handleStart = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || msg.from.username || 'клієнте';

  const welcomeMessage = `${i18n.t('telegram.start')}\n\n` +
    `Ласкаво просимо, ${userName}! 👋\n\n` +
    `Я ваш помічник для запису в наш салон краси.\n\n` +
    `Оберіть дію нижче:`;

    // Get Mini App URLs
    const config = require('../config');
    const bookingUrl = config.env === 'production' 
      ? 'https://shanails.com/booking' 
      : 'https://shanails.local/booking';
    const appointmentsUrl = config.env === 'production' 
      ? 'https://shanails.com/appointments' 
      : 'https://shanails.local/appointments';
  
  const userData = {
    userId: msg.from.id.toString(),
    chatId: chatId.toString(),
    timestamp: Date.now()
  };
  
  const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { 
            text: '📅 Записатися', 
            web_app: { url: `${bookingUrl}?tgWebAppStartParam=${encodedData}` }
          },
          { 
            text: '📋 Мої записи', 
            web_app: { url: `${appointmentsUrl}?tgWebAppStartParam=${encodedData}` }
          }
        ],
        [
          { text: '💅 Послуги', callback_data: 'services_list' },
          { text: '👩‍🎨 Майстри', callback_data: 'masters_list' }
        ],
        [
          { text: 'ℹ️ Допомога', callback_data: 'help_info' },
          { text: '📞 Контакти', callback_data: 'contact_info' }
        ]
      ]
    }
  };

  try {
    await bot.sendMessage(chatId, welcomeMessage, keyboard);
  } catch (error) {
    logger.error('Error in handleStart:', error);
  }
};

const handleHelp = async (bot, msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `🤖 *Допомога по боту*\n\n` +
    `Я допоможу вам:\n\n` +
    `📅 *Записатися на послугу* - оберіть зручний час та майстра\n` +
    `📋 *Переглянути ваші записи* - всі активні записи в одному місці\n` +
    `❌ *Скасувати запис* - якщо плани змінилися\n` +
    `💅 *Дізнатися про послуги* - повний список та ціни\n` +
    `👩‍🎨 *Познайомитися з майстрами* - їх спеціалізація та рейтинг\n\n` +
    `*Команди:*\n` +
    `/start - головне меню\n` +
    `/help - ця довідка\n` +
    `/book - швидкий запис\n` +
    `/myappointments - мої записи\n\n` +
    `Якщо у вас виникли питання, зверніться до адміністратора салону.`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: i18n.t('telegram.backToMenu'), callback_data: 'back_to_menu' }
        ]
      ]
    }
  };

  try {
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown', ...keyboard });
  } catch (error) {
    logger.error('Error in handleHelp:', error);
  }
};

const handleBook = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Open Mini App for booking
    const config = require('../config');
    const baseUrl = config.env === 'production' 
      ? 'https://shanails.com/booking' 
      : 'https://shanails.local/booking';
    
    const userData = {
      userId: userId.toString(),
      chatId: chatId.toString(),
      view: 'booking',
      timestamp: Date.now()
    };
    
    const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');
    const miniAppUrl = `${baseUrl}?tgWebAppStartParam=${encodedData}`;
    
    const message = '📅 *Запис на послугу*\n\n' +
      'Натисніть кнопку нижче, щоб відкрити зручний інтерфейс для запису:';
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: '📅 Відкрити запис', 
              web_app: { url: miniAppUrl }
            }
          ]
        ]
      }
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });
  } catch (error) {
    logger.error('Error in handleBook:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

const handleMyAppointments = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Open Mini App for appointments
    const config = require('../config');
    const baseUrl = config.env === 'production' 
      ? 'https://shanails.com/appointments' 
      : 'https://shanails.local/appointments';
    
    const userData = {
      userId: userId.toString(),
      chatId: chatId.toString(),
      view: 'appointments',
      timestamp: Date.now()
    };
    
    const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');
    const miniAppUrl = `${baseUrl}?tgWebAppStartParam=${encodedData}`;
    
    const message = '📋 *Мої записи*\n\n' +
      'Натисніть кнопку нижче, щоб переглянути ваші записи:';
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: '📋 Мої записи', 
              web_app: { url: miniAppUrl }
            }
          ]
        ]
      }
    };
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...keyboard });
  } catch (error) {
    logger.error('Error in handleMyAppointments:', error);
    await bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз.');
  }
};

module.exports = {
  handleStart,
  handleHelp,
  handleBook,
  handleMyAppointments,
};