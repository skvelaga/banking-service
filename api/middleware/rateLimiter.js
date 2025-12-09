/**
 * Rate Limiter Middleware
 * Implements a sliding window rate limiter using in-memory storage
 * For production, consider using Redis for distributed rate limiting
 */

// Store for rate limiting data
const rateLimitStore = new Map();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Custom error message
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute default
    maxRequests = 100, // 100 requests per window default
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let rateLimitData = rateLimitStore.get(key);

    if (!rateLimitData || now - rateLimitData.windowStart > windowMs) {
      // Start new window
      rateLimitData = {
        windowStart: now,
        windowMs,
        count: 1
      };
      rateLimitStore.set(key, rateLimitData);
    } else {
      rateLimitData.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - rateLimitData.count);
    const resetTime = Math.ceil((rateLimitData.windowStart + windowMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (rateLimitData.count > maxRequests) {
      res.setHeader('Retry-After', resetTime);
      return res.status(429).json({
        message,
        retryAfter: resetTime
      });
    }

    next();
  };
};

// Pre-configured rate limiters for different endpoints

// General API rate limiter
const generalLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests, please try again later'
});

// Strict rate limiter for auth endpoints (prevent brute force)
const authLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => `auth_${req.ip || req.connection.remoteAddress}`
});

// Rate limiter for transaction endpoints
const transactionLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
  message: 'Too many transaction requests, please try again later',
  keyGenerator: (req) => `txn_${req.user?.id || req.ip}`
});

// Rate limiter for sensitive operations (card creation, etc.)
const sensitiveLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  maxRequests: 10,
  message: 'Too many sensitive operation requests, please try again later',
  keyGenerator: (req) => `sensitive_${req.user?.id || req.ip}`
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  transactionLimiter,
  sensitiveLimiter
};
