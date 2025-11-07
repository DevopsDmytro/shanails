const logger = require('../utils/logger');
const i18n = require('../locales');

const setupMiddleware = (bot) => {
  // Middleware to log all incoming messages
  bot.on('message', (msg) => {
    logger.info('Telegram message received:', {
      chatId: msg.chat.id,
      userId: msg.from.id,
      username: msg.from.username,
      text: msg.text,
      type: msg.chat.type
    });
  });

  // Middleware to log all callback queries
  bot.on('callback_query', (callbackQuery) => {
    logger.info('Telegram callback query received:', {
      chatId: callbackQuery.message.chat.id,
      userId: callbackQuery.from.id,
      data: callbackQuery.data
    });
  });

  // Rate limiting middleware
  const userLastMessage = new Map();
  const RATE_LIMIT_MS = 1000; // 1 second between messages

  bot.on('message', (msg) => {
    const userId = msg.from.id;
    const now = Date.now();
    const lastMessage = userLastMessage.get(userId);

    if (lastMessage && now - lastMessage < RATE_LIMIT_MS) {
      // Ignore message if rate limited
      return;
    }

    userLastMessage.set(userId, now);
  });

  // User session management
  const userSessions = new Map();

  bot.on('callback_query', (callbackQuery) => {
    const userId = callbackQuery.from.id;
    
    if (!userSessions.has(userId)) {
      userSessions.set(userId, {
        step: 'start',
        data: {},
        createdAt: new Date()
      });
    }
  });

  // Cleanup old sessions (run every hour)
  setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [userId, session] of userSessions.entries()) {
      if (session.createdAt < oneHourAgo) {
        userSessions.delete(userId);
        logger.info(`Cleaned up session for user ${userId}`);
      }
    }
  }, 60 * 60 * 1000); // Every hour

  // Make sessions available to handlers
  bot.getUserSession = (userId) => {
    return userSessions.get(userId) || {
      step: 'start',
      data: {},
      createdAt: new Date()
    };
  };

  bot.setUserSession = (userId, session) => {
    userSessions.set(userId, session);
  };

  bot.clearUserSession = (userId) => {
    userSessions.delete(userId);
  };

  // Error handling middleware
  bot.on('polling_error', (error) => {
    logger.error('Telegram polling error:', error);
  });

  bot.on('webhook_error', (error) => {
    logger.error('Telegram webhook error:', error);
  });

  // Localization middleware
  bot.on('message', (msg) => {
    const languageCode = msg.from.language_code || 'uk';
    
    // Set locale based on user's language
    if (languageCode.startsWith('uk')) {
      i18n.setLocale('uk');
    } else if (languageCode.startsWith('ru')) {
      i18n.setLocale('uk'); // Use Ukrainian for Russian too
    } else if (languageCode.startsWith('en')) {
      i18n.setLocale('uk'); // Default to Ukrainian
    } else {
      i18n.setLocale('uk');
    }
  });

  logger.info('Telegram bot middleware setup completed');
};

module.exports = {
  setupMiddleware
};