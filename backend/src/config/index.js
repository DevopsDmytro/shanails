const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  },
  
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',') : 
        ['http://localhost:5173', 'http://localhost:80'];
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  },
  
  appointment: {
    maxAdvanceDays: parseInt(process.env.MAX_ADVANCE_DAYS) || 30,
    minAdvanceHours: parseInt(process.env.MIN_ADVANCE_HOURS) || 2,
    cancellationDeadlineHours: parseInt(process.env.CANCELLATION_DEADLINE_HOURS) || 24,
  },
  
  business: {
    workingHoursStart: process.env.WORKING_HOURS_START || '09:00',
    workingHoursEnd: process.env.WORKING_HOURS_END || '19:00',
    timezone: process.env.TIMEZONE || 'Europe/Kyiv',
  },
};

const validateConfig = () => {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (config.env === 'production' && !process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is required in production');
  }
};

validateConfig();

module.exports = config;