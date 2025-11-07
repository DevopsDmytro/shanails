const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication middleware for Express.js
 * Verifies JWT token and attaches user to request object
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Токен доступу обов\'язковий'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Недійсний токен'
      });
    }

    try {
      // Attach user to request object
      req.user = await prisma.user.findUnique({
        where: { id: BigInt(user.id) },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isBlocked: true,
          isUnreliable: true
        }
      });

      if (!req.user || !req.user.isActive) {
        return res.status(403).json({
          error: 'User not found or inactive',
          message: 'Користувача не знайдено або неактивний'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        message: 'Помилка автентифікації'
      });
    }
  });
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Потрібна автентифікація'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Недостатньо прав доступу'
      });
    }

    next();
  };
};

/**
 * Telegram user authentication middleware
 * For bot-based authentication using telegramId
 */
const authenticateTelegramUser = async (req, res, next) => {
  const telegramId = req.headers['x-telegram-id'];

  if (!telegramId) {
    return res.status(401).json({
      error: 'Telegram ID required',
      message: 'Потрібен Telegram ID'
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isBlocked: true,
        isUnreliable: true
      }
    });

    if (!user) {
      // For booking routes, allow user creation later in the process
      const originalUrl = req.originalUrl || req.url || '';
      if (originalUrl.includes('/bookings/flow/')) {
        // Create a temporary user object for authentication
        req.user = {
          telegramId: BigInt(telegramId),
          firstName: 'Telegram',
          lastName: 'User',
          role: 'CUSTOMER',
          isActive: true,
          isBlocked: false,
          isUnreliable: false,
          isTemporary: true // Flag to indicate user needs to be created
        };
        return next();
      }
      
      return res.status(403).json({
        error: 'User not found',
        message: 'Користувача не знайдено'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'User inactive',
        message: 'Користувача неактивний'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Помилка автентифікації'
    });
  }
};

/**
 * Check if user is blocked or unreliable
 */
const checkUserStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Потрібна автентифікація'
    });
  }

  if (req.user.isBlocked) {
    return res.status(403).json({
      error: 'User blocked',
      message: 'Користувача заблоковано'
    });
  }

  if (req.user.isUnreliable) {
    return res.status(403).json({
      error: 'User unreliable',
      message: 'Користувач вважається ненадійним'
    });
  }

  next();
};

/**
 * Flexible authentication middleware that accepts either JWT token or Telegram ID
 */
const authenticateFlexible = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const telegramId = req.headers['x-telegram-id'];
  const token = authHeader && authHeader.split(' ')[1];

  // Try JWT token authentication first
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) {
        // If JWT fails, try Telegram auth
        if (telegramId) {
          return authenticateTelegramUser(req, res, next);
        }
        return res.status(403).json({
          error: 'Invalid token',
          message: 'Недійсний токен'
        });
      }

      try {
        // Attach user to request object
        req.user = await prisma.user.findUnique({
          where: { id: BigInt(user.id) },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isBlocked: true,
            isUnreliable: true
          }
        });

        if (!req.user || !req.user.isActive) {
          return res.status(403).json({
            error: 'User not found or inactive',
            message: 'Користувача не знайдено або неактивний'
          });
        }

        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
          error: 'Authentication error',
          message: 'Помилка автентифікації'
        });
      }
    });
  } else if (telegramId) {
    // Use Telegram authentication
    return authenticateTelegramUser(req, res, next);
  } else {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Потрібна автентифікація'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  authenticateTelegramUser,
  authenticateFlexible,
  checkUserStatus
};