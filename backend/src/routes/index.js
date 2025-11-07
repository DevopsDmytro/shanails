const express = require('express');
const authRoutes = require('./auth');
const serviceRoutes = require('./services');
const masterRoutes = require('./masters');
const appointmentRoutes = require('./appointments');
const bookingRoutes = require('./bookings');
const adminRoutes = require('./admin');
const botRoutes = require('./bot');

const router = express.Router();

// API versioning
router.use('/v1/auth', authRoutes);
router.use('/v1/services', serviceRoutes);
router.use('/v1/masters', masterRoutes);
router.use('/v1/appointments', appointmentRoutes);
router.use('/v1/bookings', bookingRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/bot', botRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health check
router.get('/health/db', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Simple database query to check connection
    await prisma.user.count();
    
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
    
    await prisma.$disconnect();
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;