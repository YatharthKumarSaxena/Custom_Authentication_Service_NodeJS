const { 
    deviceBasedRateLimiters
} = require("./device-based.rate-limiter");

const {
    userAndDeviceBasedRateLimiters
} = require("./general-api.rate-limiter");

const { globalLimiter } = require("./global.rate-limiter");

const rateLimiters = {
    // Global
    globalLimiter,
    
    ...deviceBasedRateLimiters,
    ...userAndDeviceBasedRateLimiters
};

module.exports = { rateLimiters };
