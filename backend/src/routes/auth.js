const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../middleware/asyncHandler');
const { ValidationError } = require('../utils/errors');
const adminService = require('../services/adminService');

const router = express.Router();

// Validation schema for login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Valid email required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

// POST /auth/login - Admin login
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { email, password } = value;
  const result = await adminService.login(email, password);

  res.json({
    message: 'Login successful',
    ...result
  });
}));

module.exports = router;