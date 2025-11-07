const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const masterService = require('./masterService');
const serviceService = require('./serviceService');

const prisma = new PrismaClient();

class BookingService {
  async createAppointment(bookingData) {
    try {
      const { customerId, masterId, serviceIds, startTime, customerNotes } = bookingData;

      const customer = await prisma.user.findUnique({
        where: { id: BigInt(customerId) }
      });

      if (!customer || !customer.isActive) {
        throw new Error('Customer not found or inactive');
      }

      const master = await prisma.masterProfile.findUnique({
        where: { id: BigInt(masterId) },
        include: { user: true }
      });

      if (!master || !master.isActive) {
        throw new Error('Master not found or inactive');
      }

      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds.map(id => BigInt(id)) },
          isActive: true
        }
      });

      if (services.length !== serviceIds.length) {
        throw new Error('One or more services not found or inactive');
      }

      const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
      const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
      
      // Validate: Total duration cannot exceed 120 minutes (2 hours)
      if (totalDuration > 120) {
        throw new Error('Total duration of services cannot exceed 2 hours (120 minutes)');
      }
      
      const startTimeDate = new Date(startTime);
      const endTimeDate = new Date(startTimeDate.getTime() + totalDuration * 60 * 1000);

      // Get availability for the date with fixed 2-hour slots
      const availability = await masterService.getMasterAvailability(
        masterId, 
        startTimeDate.toISOString().split('T')[0]
      );

      if (!availability.available) {
        throw new Error('Master is not available at this time');
      }

      // Find matching time slot
      const requestedSlot = availability.timeSlots.find(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        return slotStart <= startTimeDate && slotEnd >= endTimeDate;
      });

      if (!requestedSlot) {
        throw new Error('Requested time slot is not available');
      }

      const conflictingAppointments = await prisma.appointment.findMany({
        where: {
          masterId: BigInt(masterId),
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              startTime: { lt: endTimeDate },
              endTime: { gt: startTimeDate }
            }
          ]
        }
      });

      if (conflictingAppointments.length > 0) {
        throw new Error('Time slot already booked');
      }

      const appointment = await prisma.appointment.create({
        data: {
          customerId: BigInt(customerId),
          masterId: BigInt(masterId),
          serviceIds: serviceIds.map(id => BigInt(id)),
          startTime: startTimeDate,
          endTime: endTimeDate,
          totalPrice: totalPrice,
          customerNotes: customerNotes || null,
          status: 'SCHEDULED'
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          services: true
        }
      });

      logger.info(`Appointment created: ${appointment.id} for customer ${customerId} with master ${masterId}`);
      
      return appointment;
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getCustomerAppointments(customerId, filters = {}) {
    try {
      const { status, startDate, endDate, limit = 20, offset = 0 } = filters;
      
      const where = {
        customerId: BigInt(customerId),
        ...(status && { status }),
        ...(startDate && { startTime: { gte: new Date(startDate) } }),
        ...(endDate && { startTime: { lte: new Date(endDate) } })
      };

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          services: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true
            }
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      return appointments;
    } catch (error) {
      logger.error(`Error fetching appointments for customer ${customerId}:`, error);
      throw error;
    }
  }

  async getAppointmentById(appointmentId, userId = null, userRole = null) {
    try {
      const where = { id: BigInt(appointmentId) };
      
      if (userRole === 'CUSTOMER' && userId) {
        where.customerId = BigInt(userId);
      }

      const appointment = await prisma.appointment.findUnique({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true
                }
              }
            }
          },
          services: true,
          review: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return appointment;
    } catch (error) {
      logger.error(`Error fetching appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId, status, adminNotes = null) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: BigInt(appointmentId) }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const validTransitions = {
        'SCHEDULED': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['IN_PROGRESS', 'CANCELLED'],
        'IN_PROGRESS': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': [],
        'NO_SHOW': []
      };

      if (!validTransitions[appointment.status].includes(status)) {
        throw new Error(`Cannot change status from ${appointment.status} to ${status}`);
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: BigInt(appointmentId) },
        data: {
          status,
          adminNotes: adminNotes || appointment.adminNotes,
          updatedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          services: true
        }
      });

      logger.info(`Appointment ${appointmentId} status updated to ${status}`);
      
      return updatedAppointment;
    } catch (error) {
      logger.error(`Error updating appointment status ${appointmentId}:`, error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId, customerId, reason = null) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: BigInt(appointmentId) }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.customerId !== BigInt(customerId)) {
        throw new Error('Not authorized to cancel this appointment');
      }

      if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
        throw new Error('Cannot cancel appointment in current status');
      }

      const now = new Date();
      const appointmentTime = new Date(appointment.startTime);
      const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 2) {
        throw new Error('Cannot cancel appointment less than 2 hours before start time');
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: BigInt(appointmentId) },
        data: {
          status: 'CANCELLED',
          adminNotes: `Cancelled by customer: ${reason || 'No reason provided'}`,
          updatedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          services: true
        }
      });

      logger.info(`Appointment ${appointmentId} cancelled by customer ${customerId}`);
      
      return updatedAppointment;
    } catch (error) {
      logger.error(`Error cancelling appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  async getAvailableTimeSlots(masterId, date, serviceIds) {
    try {
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds.map(id => BigInt(id)) },
          isActive: true
        }
      });

      if (services.length !== serviceIds.length) {
        throw new Error('One or more services not found or inactive');
      }

      const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
      
      const availability = await masterService.getMasterAvailability(masterId, date);
      
      if (!availability.available) {
        return [];
      }

      const availableSlots = availability.timeSlots.filter(slot => {
        const slotDuration = (slot.endTime - slot.startTime) / (1000 * 60);
        return slotDuration >= totalDuration;
      });

      return availableSlots;
    } catch (error) {
      logger.error(`Error getting available time slots for master ${masterId}:`, error);
      throw error;
    }
  }

  async getUpcomingAppointments(masterId = null, days = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const where = {
        startTime: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      };

      if (masterId) {
        where.masterId = BigInt(masterId);
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          master: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          services: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true
            }
          }
        },
        orderBy: { startTime: 'asc' }
      });

      return appointments;
    } catch (error) {
      logger.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  checkConsecutiveSlots(timeSlots, startTime, endTime) {
    // Sort time slots by start time
    const sortedSlots = timeSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Find a slot that contains the requested time range
    const containingSlot = sortedSlots.find(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      return slotStart <= startTime && slotEnd >= endTime;
    });
    
    return !!containingSlot;
  }
}

module.exports = new BookingService();