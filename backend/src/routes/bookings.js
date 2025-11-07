const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateToken, authenticateTelegramUser, authenticateFlexible } = require('../middleware/auth');
const bookingService = require('../services/bookingService');
const masterService = require('../services/masterService');
const serviceService = require('../services/serviceService');

const router = express.Router();

// Validation schema for booking request
const bookingRequestSchema = Joi.object({
  masterId: Joi.number().integer().positive().required().messages({
    'number.base': 'Master ID must be a number',
    'number.integer': 'Master ID must be an integer',
    'number.positive': 'Master ID must be positive',
    'any.required': 'Master ID is required'
  }),
  serviceIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'array.base': 'Service IDs must be an array',
    'array.min': 'At least one service ID is required',
    'any.required': 'Service IDs array is required'
  }),
  date: Joi.date().iso().min('now').required().messages({
    'date.base': 'Date must be a valid date',
    'date.format': 'Date must be in ISO format',
    'date.min': 'Date must be in the future',
    'any.required': 'Date is required'
  }),
  customerNotes: Joi.string().optional().allow('').max(500).messages({
    'string.base': 'Customer notes must be a string',
    'string.max': 'Customer notes must not exceed 500 characters'
  })
});

// Validation schema for availability check
const availabilityCheckSchema = Joi.object({
  masterId: Joi.number().integer().positive().required().messages({
    'number.base': 'Master ID must be a number',
    'number.integer': 'Master ID must be an integer',
    'number.positive': 'Master ID must be positive',
    'any.required': 'Master ID is required'
  }),
  serviceIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'array.base': 'Service IDs must be an array',
    'array.min': 'At least one service ID is required',
    'any.required': 'Service IDs array is required'
  }),
  date: Joi.date().iso().min('now').required().messages({
    'date.base': 'Date must be a valid date',
    'date.format': 'Date must be in ISO format',
    'date.min': 'Date must be in the future',
    'any.required': 'Date is required'
  })
});

// GET /bookings/flow/init - Initialize booking flow with available options
router.get('/flow/init', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  // Get all services
  const services = category 
    ? await serviceService.getServicesByCategory(category)
    : await serviceService.getAllServices();

  // Get all active masters
  const masters = await masterService.getAllActiveMasters();

  // Get categories
  const categories = await serviceService.getCategories();

  res.json({
    success: true,
    data: {
      services,
      masters,
      categories,
      flow: {
        step: 'init',
        nextSteps: ['select-services', 'select-master', 'select-time', 'confirm']
      }
    }
  });
}));

// GET /bookings/flow/services/:category - Get services for category
router.get('/flow/services/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const services = await serviceService.getServicesByCategory(category);
  
  res.json({
    success: true,
    data: {
      services,
      category,
      flow: {
        step: 'services-selected',
        nextSteps: ['select-master', 'select-time', 'confirm']
      }
    }
  });
}));

// GET /bookings/flow/masters/:serviceId - Get masters for service
router.get('/flow/masters/:serviceId', asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const masters = await masterService.getMastersByService(serviceId);
  
  res.json({
    success: true,
    data: {
      masters,
      serviceId,
      flow: {
        step: 'master-available',
        nextSteps: ['select-time', 'confirm']
      }
    }
  });
}));

// POST /bookings/flow/availability - Check availability for booking
router.post('/flow/availability', asyncHandler(async (req, res) => {
  const { error, value } = availabilityCheckSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { masterId, serviceIds, date } = value;
  
  // Get available time slots
  const timeSlots = await bookingService.getAvailableTimeSlots(
    masterId,
    date.toISOString().split('T')[0],
    serviceIds
  );

  // Get master and service details
  const master = await masterService.getMasterById(masterId);
  const services = await serviceService.getAllServices({
    // Filter by serviceIds
  });

  const selectedServices = services.filter(service => 
    serviceIds.includes(service.id.toString())
  );

  // Calculate total duration and price
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + Number(service.price), 0);

  res.json({
    success: true,
    data: {
      master,
      services: selectedServices,
      date: date.toISOString().split('T')[0],
      timeSlots,
      summary: {
        totalDuration,
        totalPrice,
        serviceCount: selectedServices.length
      },
      flow: {
        step: 'time-available',
        nextSteps: ['select-time', 'confirm']
      }
    }
  });
}));

// POST /bookings/flow/confirm - Confirm and create booking
router.post('/flow/confirm', authenticateFlexible, asyncHandler(async (req, res) => {
  const { error, value } = bookingRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { masterId, serviceIds, date, customerNotes } = value;

  // Convert date to startTime (use the date as start time)
  const startTime = new Date(date);
  
  let customerId = req.user.id;
  
  // For Telegram users, ensure they exist as customers
  if (req.user.telegramId) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      let user;
      
      // If user is temporary (doesn't exist in DB), create them
      if (req.user.isTemporary) {
        user = await prisma.user.create({
          data: {
            telegramId: BigInt(req.user.telegramId),
            firstName: req.user.firstName || 'Telegram',
            lastName: req.user.lastName || 'User',
            role: 'CUSTOMER',
            isActive: true,
            isBlocked: false,
            isUnreliable: false
          }
        });
      } else {
        // User exists, get their full data
        user = await prisma.user.findUnique({
          where: { telegramId: BigInt(req.user.telegramId) }
        });
        
        if (!user) {
          // Fallback: create user if not found
          user = await prisma.user.create({
            data: {
              telegramId: BigInt(req.user.telegramId),
              firstName: req.user.firstName || 'Telegram',
              lastName: req.user.lastName || 'User',
              role: 'CUSTOMER',
              isActive: true,
              isBlocked: false,
              isUnreliable: false
            }
          });
        }
      }
      
      customerId = user.id;
    } catch (error) {
      console.error('Error handling Telegram user:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process user account'
      });
    } finally {
      await prisma.$disconnect();
    }
  }
  
  // Create booking data
  const bookingData = {
    customerId,
    masterId,
    serviceIds,
    startTime: startTime.toISOString(),
    customerNotes
  };

  const appointment = await bookingService.createAppointment(bookingData);

  res.status(201).json({
    success: true,
    data: {
      appointment,
      flow: {
        step: 'completed',
        message: 'Booking confirmed successfully'
      }
    }
  });
}));

// GET /bookings/flow/summary/:appointmentId - Get booking summary
router.get('/flow/summary/:appointmentId', authenticateFlexible, asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  
  const appointment = await bookingService.getAppointmentById(
    appointmentId,
    req.user.id,
    req.user.role
  );

  res.json({
    success: true,
    data: {
      appointment,
      flow: {
        step: 'summary',
        message: 'Booking details retrieved successfully'
      }
    }
  });
}));

// GET /bookings/flow/cancel/:appointmentId - Cancel booking
router.post('/flow/cancel/:appointmentId', authenticateFlexible, asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;
  
  const appointment = await bookingService.cancelAppointment(
    appointmentId,
    req.user.id,
    reason
  );

  res.json({
    success: true,
    data: {
      appointment,
      flow: {
        step: 'cancelled',
        message: 'Booking cancelled successfully'
      }
    }
  });
}));

module.exports = router;