const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateToken } = require('../middleware/auth');
const bookingService = require('../services/bookingService');
const adminService = require('../services/adminService');

const router = express.Router();

// Validation schema for creating appointment
const createAppointmentSchema = Joi.object({
  customerId: Joi.number().integer().positive().required().messages({
    'number.base': 'Customer ID must be a number',
    'number.integer': 'Customer ID must be an integer',
    'number.positive': 'Customer ID must be positive',
    'any.required': 'Customer ID is required'
  }),
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
  startTime: Joi.date().iso().min('now').required().messages({
    'date.base': 'Start time must be a valid date',
    'date.format': 'Start time must be in ISO format',
    'date.min': 'Start time must be in the future',
    'any.required': 'Start time is required'
  }),
  customerNotes: Joi.string().optional().allow('').max(500).messages({
    'string.base': 'Customer notes must be a string',
    'string.max': 'Customer notes must not exceed 500 characters'
  })
});

// Validation schema for updating appointment status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW').required().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be one of: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW',
    'any.required': 'Status is required'
  }),
  adminNotes: Joi.string().optional().allow('').max(500).messages({
    'string.base': 'Admin notes must be a string',
    'string.max': 'Admin notes must not exceed 500 characters'
  })
});

// Validation schema for cancelling appointment
const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().optional().allow('').max(500).messages({
    'string.base': 'Reason must be a string',
    'string.max': 'Reason must not exceed 500 characters'
  })
});

// GET /appointments - Get appointments (with filtering)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    status,
    startDate,
    endDate,
    masterId,
    customerId,
    page = 1,
    limit = 20
  } = req.query;

  // Admins can see all appointments with advanced filtering
  if (req.user.role === 'ADMIN') {
    const filters = {
      status,
      dateFrom: startDate,
      dateTo: endDate,
      masterId,
      customerId,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await adminService.getAppointments(filters);
    
    res.json({
      success: true,
      data: result
    });
  } else {
    // Customers and Masters use existing logic
    const filters = {
      status,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Customers can only see their own appointments
    if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.id;
    }

    const appointments = await bookingService.getCustomerAppointments(
      filters.customerId || req.user.id,
      filters
    );

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: appointments.length,
          pages: Math.ceil(appointments.length / limit)
        }
      }
    });
  }
}));

// GET /appointments/upcoming - Get upcoming appointments
router.get('/upcoming', authenticateToken, asyncHandler(async (req, res) => {
  const { days = 7, masterId } = req.query;
  
  const appointments = await bookingService.getUpcomingAppointments(
    masterId,
    parseInt(days)
  );

  res.json({
    success: true,
    data: {
      appointments,
      days: parseInt(days)
    }
  });
}));

// GET /appointments/:id - Get appointment by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const appointment = await bookingService.getAppointmentById(
    id,
    req.user.id,
    req.user.role
  );

  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

// POST /appointments - Create new appointment
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = createAppointmentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Customers can only create appointments for themselves
  if (req.user.role === 'CUSTOMER' && value.customerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Customers can only create appointments for themselves'
    });
  }

  const appointment = await bookingService.createAppointment(value);

  res.status(201).json({
    success: true,
    data: {
      appointment
    }
  });
}));

// PUT /appointments/:id/status - Update appointment status
router.put('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = updateStatusSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Only admins and masters can update appointment status
  if (!['ADMIN', 'MASTER'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only admins and masters can update appointment status'
    });
  }

  const appointment = await bookingService.updateAppointmentStatus(
    id,
    value.status,
    value.adminNotes
  );

  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

// POST /appointments/:id/cancel - Cancel appointment
router.post('/:id/cancel', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = cancelAppointmentSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const appointment = await bookingService.cancelAppointment(
    id,
    req.user.id,
    value.reason
  );

  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

// PUT /appointments/:id - Update appointment (Admin only)
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Only admins can update appointments
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Only admins can update appointments'
    });
  }

  const { id } = req.params;
  const { error, value } = updateStatusSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const appointment = await adminService.updateAppointment(id, value);

  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

// DELETE /appointments/:id - Delete appointment (Admin only)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Only admins can delete appointments
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Only admins can delete appointments'
    });
  }

  const { id } = req.params;
  const result = await adminService.deleteAppointment(id);

  res.json({
    success: true,
    data: result
  });
}));

// POST /appointments/:id/no-show - Mark as no-show (Admin only)
router.post('/:id/no-show', authenticateToken, asyncHandler(async (req, res) => {
  // Only admins can mark as no-show
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Only admins can mark appointments as no-show'
    });
  }

  const { id } = req.params;
  const appointment = await adminService.markNoShow(id);

  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

module.exports = router;