const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const serviceService = require('../services/serviceService');

const router = express.Router();

// GET /services - Get all services with optional filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const filters = {
    category,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    search
  };

  const services = await serviceService.getAllServices(filters);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedServices = services.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      services: paginatedServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: services.length,
        pages: Math.ceil(services.length / limit)
      }
    }
  });
}));

// GET /services/categories - Get all service categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await serviceService.getCategories();
  
  res.json({
    success: true,
    data: {
      categories
    }
  });
}));

// GET /services/popular - Get popular services
router.get('/popular', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const services = await serviceService.getPopularServices(parseInt(limit));
  
  res.json({
    success: true,
    data: {
      services
    }
  });
}));

// GET /services/search - Search services
router.get('/search', asyncHandler(async (req, res) => {
  const {
    q: query,
    category,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20
  } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query (q) is required'
    });
  }

  const filters = {
    category,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
  };

  const services = await serviceService.searchServices(query, filters);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedServices = services.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      services: paginatedServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: services.length,
        pages: Math.ceil(services.length / limit)
      },
      query
    }
  });
}));

// GET /services/category/:category - Get services by category
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const services = await serviceService.getServicesByCategory(category);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedServices = services.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      services: paginatedServices,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: services.length,
        pages: Math.ceil(services.length / limit)
      }
    }
  });
}));

// GET /services/:id - Get service by ID (must be last to avoid conflicts)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await serviceService.getServiceById(id);
  
  res.json({
    success: true,
    data: {
      service
    }
  });
}));

module.exports = router;