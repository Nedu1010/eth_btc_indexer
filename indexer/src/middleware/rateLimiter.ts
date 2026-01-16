import rateLimit from 'express-rate-limit';

// Mempool API: 250 requests per minute per IP
export const mempoolLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 250, // 250 requests per minute
    message: 'Too many requests to Mempool API, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Infura API: 100,000 requests per day (approximately 69 requests per minute)
// Being conservative, we'll set it to 60 requests per minute
export const infuraLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Conservative limit to stay under 100k/day
    message: 'Too many requests to Infura API, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter for the application
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
