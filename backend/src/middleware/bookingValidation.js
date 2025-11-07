const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Booking validation middleware
 * Provides validation schemas for booking-related requests
 */

// Common validation patterns
const objectIdSchema = Joi.string().pattern(/^[0-9]+$/).messages({
  'string.pattern.base': 'ID must be a valid number string'
});

const dateTimeSchema = Joi.date().iso().messages({
  'date.base': 'Must be a valid date',
  'date.format': 'Date must be in ISO format'
});

const futureDateTimeSchema = dateTimeSchema.min('now').messages({
  'date.min': 'Date must be in the future'
});

// Validation schemas
const schemas = {
  // Create appointment
  createAppointment: Joi.object({
    customerId: objectIdSchema.required().messages({
      'any.required': 'Customer ID is required'
    }),
    masterId: objectIdSchema.required().messages({
      'any.required': 'Master ID is required'
    }),
    serviceIds: Joi.array().items(objectIdSchema).min(1).max(5).required().messages({
      'array.base': 'Service IDs must be an array',
      'array.min': 'At least one service is required',
      'array.max': 'Maximum 5 services allowed',
      'any.required': 'Service IDs are required'
    }),
    startTime: futureDateTimeSchema.required().messages({
      'any.required': 'Start time is required'
    }),
    customerNotes: Joi.string().max(500).allow('').messages({
      'string.max': 'Customer notes must not exceed 500 characters'
    })
  }),

  // Update appointment status
  updateStatus: Joi.object({
    status: Joi.string().valid(
      'SCHEDULED', 
      'CONFIRMED', 
      'IN_PROGRESS', 
      'COMPLETED', 
      'CANCELLED', 
      'NO_SHOW'
    ).required().messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be one of: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW'
    }),
    adminNotes: Joi.string().max(500).allow('').messages({
      'string.max': 'Admin notes must not exceed 500 characters'
    })
  }),

  // Cancel appointment
  cancelAppointment: Joi.object({
    reason: Joi.string().max(500).allow('').messages({
      'string.max': 'Reason must not exceed 500 characters'
    })
  }),

  // Get appointments with filters
  getAppointments: Joi.object({
    status: Joi.string().valid(
      'SCHEDULED', 
      'CONFIRMED', 
      'IN_PROGRESS', 
      'COMPLETED', 
      'CANCELLED', 
      'NO_SHOW'
    ),
    startDate: dateTimeSchema,
    endDate: dateTimeSchema.min(Joi.ref('startDate')).messages({
      'date.min': 'End date must be after start date'
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Get master availability
  getAvailability: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required'
    }),
    serviceIds: Joi.string().pattern(/^[0-9]+(,[0-9]+)*$/).messages({
      'string.pattern.base': 'Service IDs must be comma-separated numbers'
    })
  }),

  // Get master schedule
  getSchedule: Joi.object({
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'Start date must be in YYYY-MM-DD format',
      'any.required': 'Start date is required'
    }),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'End date must be in YYYY-MM-DD format',
      'any.required': 'End date is required'
    })
  }),

  // Service filters
  serviceFilters: Joi.object({
    category: Joi.string(),
    minPrice: Joi.number().min(0).messages({
      'number.min': 'Minimum price must be non-negative'
    }),
    maxPrice: Joi.number().min(0).messages({
      'number.min': 'Maximum price must be non-negative'
    }),
    search: Joi.string().max(100).messages({
      'string.max': 'Search query must not exceed 100 characters'
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Master filters
  masterFilters: Joi.object({
    category: Joi.string(),
    serviceId: objectIdSchema,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

/**
 * Validation middleware factory
 */
const validate = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Validation schema '${schemaName}' not found`));
    }

    const data = source === 'query' ? req.query : 
                 source === 'params' ? req.params : 
                 req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      logger.warn(`Validation error for ${schemaName}:`, errorMessages);
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Replace the original data with validated and cleaned data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

/**
 * Business logic validation helpers
 */
const businessValidators = {
  /**
   * Validate appointment time slot availability
   */
  async validateTimeSlot(req, res, next) {
    try {
      const { masterId, startTime, endTime } = req.body;
      
      // Check if start time is during business hours
      const startHour = new Date(startTime).getHours();
      const endHour = new Date(endTime).getHours();
      
      if (startHour < 9 || endHour > 19) {
        return res.status(400).json({
          success: false,
          error: 'Appointments must be scheduled between 9:00 and 19:00'
        });
      }

      // Check if appointment duration is reasonable (15 min to 8 hours)
      const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60);
      if (duration < 15 || duration > 480) {
        return res.status(400).json({
          success: false,
          error: 'Appointment duration must be between 15 minutes and 8 hours'
        });
      }

      // Check if appointment is not too far in future (max 30 days)
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      if (new Date(startTime) > maxDate) {
        return res.status(400).json({
          success: false,
          error: 'Appointments cannot be scheduled more than 30 days in advance'
        });
      }

      next();
    } catch (error) {
      logger.error('Error in time slot validation:', error);
      next(error);
    }
  },

  /**
   * Validate customer booking limits
   */
  async validateCustomerLimits(req, res, next) {
    try {
      const { customerId } = req.body;
      
      // This would typically query the database
      // For now, we'll add the logic to the service layer
      
      next();
    } catch (error) {
      logger.error('Error in customer limits validation:', error);
      next(error);
    }
  },

  /**
   * Validate master availability
   */
  async validateMasterAvailability(req, res, next) {
    try {
      const { masterId, startTime, endTime } = req.body;
      
      // Check if master exists and is active
      // This would typically query the database
      // For now, we'll add the logic to the service layer
      
      next();
    } catch (error) {
      logger.error('Error in master availability validation:', error);
      next(error);
    }
  },

  /**
   * Validate service compatibility
   */
  async validateServiceCompatibility(req, res, next) {
    try {
      const { serviceIds, masterId } = req.body;
      
      // Check if all services exist and are active
      // Check if master can perform all selected services
      // This would typically query the database
      // For now, we'll add the logic to the service layer
      
      next();
    } catch (error) {
      logger.error('Error in service compatibility validation:', error);
      next(error);
    }
  }
};

/**
 * Custom validation error handler
 */
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next(error);
};

module.exports = {
  validate,
  schemas,
  businessValidators,
  handleValidationError
};