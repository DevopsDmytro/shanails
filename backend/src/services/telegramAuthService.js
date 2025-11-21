const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userService = require('./userService');
const { AuthenticationError } = require('../utils/errors');

class TelegramAuthService {
    validateInitData(initData) {
        if (!initData) {
            throw new AuthenticationError('No init data provided');
        }

        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');

        if (!hash) {
            throw new AuthenticationError('No hash provided');
        }

        urlParams.delete('hash');

        // Sort keys alphabetically
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Calculate HMAC-SHA256 signature
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(config.telegram.botToken)
            .digest();

        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (calculatedHash !== hash) {
            throw new AuthenticationError('Invalid init data signature');
        }

        // Parse user data
        const userStr = urlParams.get('user');
        if (!userStr) {
            throw new AuthenticationError('No user data found');
        }

        return JSON.parse(userStr);
    }

    async login(initData) {
        // 1. Validate initData
        const telegramUser = this.validateInitData(initData);

        // 2. Find user in DB
        const user = await userService.findByTelegramId(telegramUser.id);

        if (!user) {
            throw new AuthenticationError('User not found. Please start the bot first.');
        }

        // 3. Generate JWT
        const token = this.generateToken(user);

        return {
            user,
            token
        };
    }

    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                telegramId: user.telegramId,
                role: user.role
            },
            config.jwtSecret,
            { expiresIn: '7d' }
        );
    }
}

module.exports = new TelegramAuthService();
