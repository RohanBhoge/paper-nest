import rateLimit from 'express-rate-limit';

// Rate limiter for login endpoints (both admin and student)
export const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many login attempts',
            message: 'You have exceeded the maximum number of login attempts. Please try again after 15 minutes.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' minutes'
        });
    }
});

// Rate limiter for registration endpoints
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration requests per hour
    message: 'Too many accounts created from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many registration attempts',
            message: 'You have exceeded the maximum number of registration attempts. Please try again after an hour.'
        });
    }
});

// General API rate limiter (for other endpoints)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
        });
    }
});
