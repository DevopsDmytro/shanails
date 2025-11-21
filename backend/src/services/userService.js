const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class UserService {
    async findByTelegramId(telegramId) {
        try {
            // Convert telegramId to BigInt if it's not already
            const id = typeof telegramId === 'string' ? BigInt(telegramId) : telegramId;

            const user = await prisma.user.findUnique({
                where: { telegramId: id }
            });

            // Convert BigInt to string for JSON serialization
            if (user) {
                return this.serializeUser(user);
            }

            return null;
        } catch (error) {
            logger.error(`Error finding user by telegram ID ${telegramId}:`, error);
            throw error;
        }
    }

    async createOrUpdateUser(telegramId, userData) {
        try {
            const id = typeof telegramId === 'string' ? BigInt(telegramId) : telegramId;

            const { firstName, lastName, phone, username } = userData;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { telegramId: id }
            });

            if (existingUser) {
                // Update existing user
                const updatedUser = await prisma.user.update({
                    where: { telegramId: id },
                    data: {
                        firstName: firstName || existingUser.firstName,
                        lastName: lastName || existingUser.lastName,
                        phone: phone || existingUser.phone,
                        updatedAt: new Date()
                    }
                });
                return this.serializeUser(updatedUser);
            }

            // Create new user
            const newUser = await prisma.user.create({
                data: {
                    telegramId: id,
                    firstName: firstName || 'Unknown',
                    lastName: lastName || '',
                    phone: phone,
                    role: 'CUSTOMER',
                    isActive: true
                }
            });

            return this.serializeUser(newUser);
        } catch (error) {
            logger.error(`Error creating/updating user ${telegramId}:`, error);
            throw error;
        }
    }

    serializeUser(user) {
        return {
            ...user,
            id: user.id.toString(),
            telegramId: user.telegramId ? user.telegramId.toString() : null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };
    }
}

module.exports = new UserService();
