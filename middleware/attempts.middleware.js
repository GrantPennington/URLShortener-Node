const rateLimit = require('express-rate-limit');

const ApiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // 15 requests
    message: 'Too many attempted requests, please try again later'
});

module.exports = ApiRateLimiter;