const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const adminService = require('../services/adminService');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin login (no auth required)
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminService.login(email, password);
  res.json(result);
}));

// Apply authentication middleware to all other admin routes
router.use(authenticateToken);
router.use(authorize('ADMIN'));

// Admin dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json(stats);
}));

// Appointments management
router.get('/appointments', asyncHandler(async (req, res) => {
  const appointments = await adminService.getAppointments(req.query);
  res.json(appointments);
}));

router.put('/appointments/:id', asyncHandler(async (req, res) => {
  const appointment = await adminService.updateAppointment(req.params.id, req.body);
  res.json(appointment);
}));

router.delete('/appointments/:id', asyncHandler(async (req, res) => {
  const result = await adminService.deleteAppointment(req.params.id);
  res.json(result);
}));

router.post('/appointments/:id/no-show', asyncHandler(async (req, res) => {
  const appointment = await adminService.markNoShow(req.params.id);
  res.json(appointment);
}));

module.exports = router;