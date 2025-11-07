const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/errors');

const prisma = new PrismaClient();

class AdminService {
  /**
   * Authenticate admin user
   */
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        masterProfile: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedError('Access denied. Admin role required.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // For now, we'll assume password is stored in a separate field or use email verification
    // In production, you'd have a proper password field and hashing
    const isPasswordValid = await this.verifyPassword(password, user.email);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    };
  }

  /**
   * Get all appointments with filtering
   */
  async getAppointments(filters = {}) {
    const {
      status,
      masterId,
      customerId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50
    } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (masterId) {
      where.masterId = BigInt(masterId);
    }

    if (customerId) {
      where.customerId = BigInt(customerId);
    }

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) {
        where.startTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.startTime.lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              telegramId: true
            }
          },
          master: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          services: true
        },
        orderBy: {
          startTime: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.appointment.count({ where })
    ]);

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update appointment
   */
  async updateAppointment(id, updateData) {
    const appointmentId = BigInt(id);

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!existingAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Validate status transition
    if (updateData.status) {
      this.validateStatusTransition(existingAppointment.status, updateData.status);
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        master: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        services: true
      }
    });

    return updatedAppointment;
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(id) {
    const appointmentId = BigInt(id);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    return { message: 'Appointment deleted successfully' };
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(id) {
    return this.updateAppointment(id, {
      status: 'NO_SHOW'
    });
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalAppointments,
      appointmentsThisMonth,
      completedAppointments,
      cancelledAppointments,
      noShows,
      totalCustomers,
      totalMasters,
      totalServices
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          startTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.appointment.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.appointment.count({
        where: { status: 'CANCELLED' }
      }),
      prisma.appointment.count({
        where: { status: 'NO_SHOW' }
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.user.count({
        where: { role: 'MASTER' }
      }),
      prisma.service.count({
        where: { isActive: true }
      })
    ]);

    return {
      totalAppointments,
      appointmentsThisMonth,
      completedAppointments,
      cancelledAppointments,
      noShows,
      totalCustomers,
      totalMasters,
      totalServices
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
  }

  /**
   * Verify password (simplified for demo)
   */
  async verifyPassword(password, email) {
    // This is a simplified verification for demo purposes
    // In production, you'd use proper password hashing
    return password === email || password === 'admin123';
  }

  /**
   * Validate appointment status transitions
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'SCHEDULED': ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
      'CONFIRMED': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // Terminal state
      'CANCELLED': [], // Terminal state
      'NO_SHOW': [] // Terminal state
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}

module.exports = new AdminService();