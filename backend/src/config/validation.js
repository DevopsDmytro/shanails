const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .default(3000),
  
  DATABASE_URL: Joi.string()
    .required(),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  
  JWT_EXPIRES_IN: Joi.string()
    .default('7d'),
  
  TELEGRAM_BOT_TOKEN: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  
  TELEGRAM_WEBHOOK_URL: Joi.string()
    .uri()
    .optional(),
  
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:5173'),
  
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(15 * 60 * 1000),
  
  RATE_LIMIT_MAX: Joi.number()
    .default(100),
  
  MAX_ADVANCE_DAYS: Joi.number()
    .default(30),
  
  MIN_ADVANCE_HOURS: Joi.number()
    .default(2),
  
  CANCELLATION_DEADLINE_HOURS: Joi.number()
    .default(24),
  
  WORKING_HOURS_START: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .default('09:00'),
  
  WORKING_HOURS_END: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .default('19:00'),
  
  TIMEZONE: Joi.string()
    .default('Europe/Kyiv'),
}).unknown();

const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  
  return value;
};

module.exports = { validateEnv };