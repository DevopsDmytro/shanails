const express = require('express');
const bot = require('../bot');
const Joi = require('joi');
const asyncHandler = require('../middleware/asyncHandler');
const { ValidationError } = require('../utils/errors');

const router = express.Router();

// Validation schema for sending message
const sendMessageSchema = Joi.object({
  chatId: Joi.number().integer().required().messages({
    'number.base': 'Chat ID must be numeric',
    'any.required': 'Chat ID is required'
  }),
  message: Joi.string().min(1).max(4096).required().messages({
    'string.min': 'Message must be at least 1 character',
    'string.max': 'Message must be 4096 characters or less',
    'any.required': 'Message is required'
  }),
  parseMode: Joi.string().valid('Markdown', 'HTML').optional().messages({
    'any.only': 'Parse mode must be Markdown or HTML'
  })
});

// Validation schema for appointment operations
const appointmentSchema = Joi.object({
  chatId: Joi.number().integer().required().messages({
    'number.base': 'Chat ID must be numeric',
    'any.required': 'Chat ID is required'
  }),
  appointment: Joi.object().required().messages({
    'object.base': 'Appointment must be an object',
    'any.required': 'Appointment is required'
  })
});

// Webhook endpoint for Telegram bot
router.post('/webhook', asyncHandler(async (req, res) => {
  if (!bot.isReady()) {
    return res.status(503).json({ error: 'Bot not ready' });
  }

  const telegramBot = bot.getBot();
  
  // Process the update
  await telegramBot.processUpdate(req.body);
  
  res.status(200).send('OK');
}));

// Get bot info
router.get('/info', asyncHandler(async (req, res) => {
  if (!bot.isReady()) {
    return res.status(503).json({ error: 'Bot not ready' });
  }

  const telegramBot = bot.getBot();
  const botInfo = await telegramBot.getMe();

  res.json({
    isReady: bot.isReady(),
    botInfo: {
      id: botInfo.id,
      username: botInfo.username,
      firstName: botInfo.first_name,
      isBot: botInfo.is_bot
    }
  });
}));

// Send message to user (admin endpoint)
router.post('/send-message', asyncHandler(async (req, res) => {
  const { error, value } = sendMessageSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  if (!bot.isReady()) {
    return res.status(503).json({ error: 'Bot not ready' });
  }

  const { chatId, message, parseMode } = value;

  const options = {};
  if (parseMode) {
    options.parse_mode = parseMode;
  }

  await bot.sendMessage(parseInt(chatId), message, options);

  res.json({ success: true, message: 'Message sent successfully' });
}));

// Send appointment reminder (internal endpoint)
router.post('/send-reminder', asyncHandler(async (req, res) => {
  const { error, value } = appointmentSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  if (!bot.isReady()) {
    return res.status(503).json({ error: 'Bot not ready' });
  }

  const { chatId, appointment } = value;

  await bot.sendAppointmentReminder(parseInt(chatId), appointment);

  res.json({ success: true, message: 'Reminder sent successfully' });
}));

// Send appointment confirmation (internal endpoint)
router.post('/send-confirmation', asyncHandler(async (req, res) => {
  const { error, value } = appointmentSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  if (!bot.isReady()) {
    return res.status(503).json({ error: 'Bot not ready' });
  }

  const { chatId, appointment } = value;

  await bot.sendAppointmentConfirmation(parseInt(chatId), appointment);

  res.json({ success: true, message: 'Confirmation sent successfully' });
}));

module.exports = router;