const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const masterService = require('../services/masterService');

const router = express.Router();

// GET /masters - Get all active masters
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const masters = await masterService.getAllActiveMasters();
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedMasters = masters.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      masters: paginatedMasters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: masters.length,
        pages: Math.ceil(masters.length / limit)
      }
    }
  });
}));

// GET /masters/category/:category - Get masters by service category
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const masters = await masterService.getMastersByCategory(category);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedMasters = masters.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      masters: paginatedMasters,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: masters.length,
        pages: Math.ceil(masters.length / limit)
      }
    }
  });
}));

// GET /masters/service/:serviceId - Get masters for specific service
router.get('/service/:serviceId', asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const masters = await masterService.getMastersByService(serviceId);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedMasters = masters.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      masters: paginatedMasters,
      serviceId,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: masters.length,
        pages: Math.ceil(masters.length / limit)
      }
    }
  });
}));

// GET /masters/:id - Get master by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const master = await masterService.getMasterById(id);
  
  res.json({
    success: true,
    data: {
      master
    }
  });
}));

// GET /masters/:id/availability - Get master availability for specific date
router.get('/:id/availability', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, serviceIds } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date parameter is required (format: YYYY-MM-DD)'
    });
  }

  if (serviceIds) {
    // Return simple array of time strings for booking flow
    const serviceIdArray = serviceIds.split(',').map(id => id.trim());
    const timeSlots = await masterService.getAvailableTimeSlots(id, date, serviceIdArray);
    
    res.json({
      success: true,
      data: {
        masterId: id,
        date,
        timeSlots
      }
    });
  } else {
    // Return detailed availability for admin/general use
    const availability = await masterService.getMasterAvailability(id, date);
    
    res.json({
      success: true,
      data: {
        masterId: id,
        date,
        availability
      }
    });
  }
}));

// GET /masters/:id/schedule - Get master schedule for date range
router.get('/:id/schedule', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Both startDate and endDate parameters are required (format: YYYY-MM-DD)'
    });
  }

  const schedule = await masterService.getMasterSchedule(id, startDate, endDate);

  res.json({
    success: true,
    data: {
      masterId: id,
      startDate,
      endDate,
      schedule
    }
  });
}));

module.exports = router;