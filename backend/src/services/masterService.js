const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class MasterService {
  async getAllActiveMasters() {
    try {
      const masters = await prisma.masterProfile.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' }
          },
          _count: {
            select: {
              appointments: {
                where: {
                  status: { in: ['COMPLETED', 'CONFIRMED'] },
                  startTime: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
              }
            }
          }
        },
        orderBy: { user: { firstName: 'asc' } }
      });

      return masters;
    } catch (error) {
      logger.error('Error fetching masters:', error);
      throw error;
    }
  }

  async getMasterById(id) {
    try {
      const master = await prisma.masterProfile.findUnique({
        where: { id: BigInt(id) },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          },
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' }
          },
          appointments: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              services: {
                select: {
                  id: true,
                  name: true,
                  duration: true
                }
              }
            },
            take: 10,
            orderBy: { startTime: 'desc' }
          }
        }
      });

      if (!master || !master.isActive) {
        throw new Error('Master not found');
      }

      return master;
    } catch (error) {
      logger.error(`Error fetching master ${id}:`, error);
      throw error;
    }
  }

  async getMastersByService(serviceId) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: BigInt(serviceId) },
        select: { category: true }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      const masters = await prisma.masterProfile.findMany({
        where: {
          isActive: true,
          specializations: {
            has: service.category
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' }
          }
        },
        orderBy: { user: { firstName: 'asc' } }
      });

      return masters;
    } catch (error) {
      logger.error(`Error fetching masters for service ${serviceId}:`, error);
      throw error;
    }
  }

  async getMasterAvailability(masterId, date) {
    try {
      logger.info(`getMasterAvailability called with date: ${date}`);
      const targetDate = new Date(date);
      logger.info(`Parsed targetDate: ${targetDate.toISOString()}`);
      
      const dayStart = new Date(targetDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setUTCHours(23, 59, 59, 999);
      
      logger.info(`Querying appointments between ${dayStart.toISOString()} and ${dayEnd.toISOString()}`);
      
      const master = await prisma.masterProfile.findUnique({
        where: { id: BigInt(masterId) },
        include: {
          appointments: {
            where: {
              startTime: {
                gte: dayStart,
                lt: dayEnd
              },
              status: { notIn: ['CANCELLED', 'NO_SHOW'] }
            },
            select: {
              startTime: true,
              endTime: true,
              status: true
            }
          }
        }
      });

      if (!master || !master.isActive) {
        throw new Error('Master not found');
      }

      // Generate fixed 2-hour slots: 10:00, 12:00, 14:00, 16:00, 18:00, 20:00
      const fixedSlots = this.generateFixedTimeSlots(targetDate);

      const bookedSlots = master.appointments.map(apt => ({
        start: new Date(apt.startTime),
        end: new Date(apt.endTime)
      }));
      
      logger.info(`Booked slots for master ${masterId}:`);
      bookedSlots.forEach((slot, i) => {
        logger.info(`  ${i + 1}. ${slot.start.toISOString()} - ${slot.end.toISOString()}`);
      });

      // Filter out slots that overlap with existing appointments
      const availableSlots = this.filterOverlappingSlots(fixedSlots, bookedSlots);

      logger.info(`Master ${masterId} availability for ${date}:`);
      logger.info(`Fixed slots: ${fixedSlots.length}`);
      logger.info(`Booked slots: ${bookedSlots.length}`);
      logger.info(`Available slots: ${availableSlots.length}`);

      return {
        available: availableSlots.length > 0,
        timeSlots: availableSlots,
        schedule: {
          startTime: '10:00',
          endTime: '22:00'
        }
      };
    } catch (error) {
      logger.error(`Error checking availability for master ${masterId}:`, error);
      throw error;
    }
  }

  async getAvailableTimeSlots(masterId, date, serviceIds) {
    try {
      logger.info(`getAvailableTimeSlots called with masterId: ${masterId}, date: ${date}, serviceIds: ${JSON.stringify(serviceIds)}`);
      
      // Validate service duration if serviceIds provided
      if (serviceIds && serviceIds.length > 0) {
        logger.info(`Validating service duration for ${serviceIds.length} services`);
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        try {
          const services = await prisma.service.findMany({
            where: {
              id: { in: serviceIds.map(id => BigInt(id)) },
              isActive: true
            }
          });

          logger.info(`Found ${services.length} services: ${JSON.stringify(services.map(s => ({ id: s.id.toString(), name: s.name, duration: s.duration })))}`);

          if (services.length !== serviceIds.length) {
            throw new Error('One or more services not found or inactive');
          }

          const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
          logger.info(`Total duration calculated: ${totalDuration} minutes`);
          
          // Enforce 120-minute limit
          if (totalDuration > 120) {
            logger.error(`Duration validation failed: ${totalDuration} > 120 minutes`);
            throw new Error('Загальна тривалість послуг не може перевищувати 120 хвилин');
          }
          
          await prisma.$disconnect();
        } catch (error) {
          await prisma.$disconnect();
          throw error;
        }
      }
      
      // Get availability with fixed 2-hour slots
      const availability = await this.getMasterAvailability(masterId, date);
      
      // Convert complex time slot objects to simple time strings as required
      const timeStrings = availability.timeSlots.map(slot => {
        const time = new Date(slot.startTime);
        return time.toTimeString().slice(0, 5); // Format as "HH:MM"
      });

      return timeStrings;
    } catch (error) {
      logger.error(`Error getting available time slots for master ${masterId}:`, error);
      throw error;
    }
  }

  generateFixedTimeSlots(targetDate) {
    // Generate fixed 2-hour slots: 10:00, 12:00, 14:00, 16:00, 18:00, 20:00
    const slotTimes = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const slots = [];

    slotTimes.forEach(timeStr => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const startTime = new Date(targetDate);
      startTime.setUTCHours(hours, minutes, 0, 0);
      
      const endTime = new Date(targetDate);
      endTime.setUTCHours(hours + 2, minutes, 0, 0);

      slots.push({
        startTime,
        endTime,
        available: true
      });
    });

    return slots;
  }

  filterOverlappingSlots(fixedSlots, bookedSlots) {
    return fixedSlots.filter(slot => {
      // Check if this slot overlaps with any existing appointment
      const hasOverlap = bookedSlots.some(booked => {
        // Slot: [slot.startTime, slot.endTime)
        // Booked: [booked.start, booked.end)
        return (
          (slot.startTime >= booked.start && slot.startTime < booked.end) ||
          (slot.endTime > booked.start && slot.endTime <= booked.end) ||
          (slot.startTime <= booked.start && slot.endTime >= booked.end)
        );
      });

      return !hasOverlap;
    });
  }

  async getMastersByCategory(category) {
    try {
      const masters = await prisma.masterProfile.findMany({
        where: {
          isActive: true,
          specializations: {
            has: category
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' }
          }
        },
        orderBy: { user: { firstName: 'asc' } }
      });

      return masters;
    } catch (error) {
      logger.error(`Error fetching masters for category ${category}:`, error);
      throw error;
    }
  }

  async getMasterSchedule(masterId, startDate, endDate) {
    try {
      const master = await prisma.masterProfile.findUnique({
        where: { id: BigInt(masterId) },
        include: {
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' }
          },
          appointments: {
            where: {
              startTime: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              },
              status: { notIn: ['CANCELLED'] }
            },
            include: {
              services: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true
                }
              }
            },
            orderBy: { startTime: 'asc' }
          }
        }
      });

      if (!master || !master.isActive) {
        throw new Error('Master not found');
      }

      return master;
    } catch (error) {
      logger.error(`Error fetching schedule for master ${masterId}:`, error);
      throw error;
    }
  }
}

module.exports = new MasterService();