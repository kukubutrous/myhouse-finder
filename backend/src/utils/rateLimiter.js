//backend/src/utils/rateLimiter.js
import rateLimit from 'express-rate-limit';

// General limiter (most routes)
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter (for auth endpoints)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Create a custom rate limiter dynamically.
 */
export function createLimiter(opts) {
    return rateLimit(opts);
}
