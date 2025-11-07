const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class ServiceService {
  async getAllServices(filters = {}) {
    try {
      const { category, minPrice, maxPrice, search } = filters;
      
      const where = {
        isActive: true,
        ...(category && { category }),
        ...(minPrice && { price: { gte: minPrice } }),
        ...(maxPrice && { price: { lte: maxPrice } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const services = await prisma.service.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      return services;
    } catch (error) {
      logger.error('Error fetching services:', error);
      throw error;
    }
  }

  async getServiceById(id) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: BigInt(id.toString()) },
        include: {
          appointments: {
            select: {
              id: true,
              startTime: true,
              status: true
            },
            take: 5,
            orderBy: { startTime: 'desc' }
          }
        }
      });

      if (!service || !service.isActive) {
        throw new Error('Service not found');
      }

      return service;
    } catch (error) {
      logger.error(`Error fetching service ${id}:`, error);
      throw error;
    }
  }

  async getServicesByCategory(category) {
    try {
      const services = await prisma.service.findMany({
        where: {
          category,
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      return services;
    } catch (error) {
      logger.error(`Error fetching services for category ${category}:`, error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await prisma.service.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' }
      });

      return categories.map(c => c.category);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw error;
    }
  }

  async searchServices(query, filters = {}) {
    try {
      const { category, minPrice, maxPrice } = filters;
      
      const where = {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ],
        ...(category && { category }),
        ...(minPrice && { price: { gte: minPrice } }),
        ...(maxPrice && { price: { lte: maxPrice } })
      };

      const services = await prisma.service.findMany({
        where,
        orderBy: [
          { _relevance: { fields: ['name'], search: query, sort: 'desc' } },
          { name: 'asc' }
        ]
      });

      return services;
    } catch (error) {
      logger.error(`Error searching services with query "${query}":`, error);
      throw error;
    }
  }

  async getPopularServices(limit = 10) {
    try {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        include: {
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
        orderBy: {
          appointments: {
            _count: 'desc'
          }
        },
        take: limit
      });

      return services;
    } catch (error) {
      logger.error('Error fetching popular services:', error);
      throw error;
    }
  }
}

module.exports = new ServiceService();