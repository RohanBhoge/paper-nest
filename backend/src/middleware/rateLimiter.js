import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisConnected } from '../config/redisConfig.js';

/**
 * Builds a rate limiter. If Redis is available, uses Redis store so limits
 * persist across restarts and work with multiple server instances.
 * Falls back to in-memory store if Redis is not connected.
 */
function buildLimiter({ windowMs, max, keyPrefix, handler }) {
    const options = {
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler,
    };

    if (isRedisConnected()) {
        options.store = new RedisStore({
            sendCommand: (...args) => getRedisClient().call(...args),
            prefix: `rl:${keyPrefix}:`,
        });
    }

    return rateLimit(options);
}

export const loginLimiter = buildLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
    keyPrefix: 'login',
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many login attempts',
            message: 'You have exceeded the maximum number of login attempts. Please try again after 15 minutes.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' minutes',
        });
    },
});

export const registerLimiter = buildLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: 'register',
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many registration attempts',
            message: 'You have exceeded the maximum number of registration attempts. Please try again after an hour.',
        });
    },
});

