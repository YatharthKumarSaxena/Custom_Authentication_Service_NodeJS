// middlewares/factories/createRedisDeviceRateLimiter.js

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("@utils/redis-client.util");
const { DEVICE_HEADERS } = require("@/configs/headers.config");
const { errorMessage, throwTooManyRequestsError } = require("@/responses/common/error-handler.response");

const createRedisDeviceRateLimiter = ({ maxRequests, windowMs, prefix, reason, message }) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    
    keyGenerator: (req) => {
      const deviceId = req.headers[DEVICE_HEADERS?.DEVICE_UUID] || req.deviceId || "UNKNOWN_DEVICE";
      return `${prefix}:${deviceId}`;
    },

    windowMs,
    max: maxRequests,
    
    message: {
      message: message || "Too many requests. Please try again later."
    },

    standardHeaders: true, 
    legacyHeaders: false, 

    handler: (req, res, next, options) => {
      try {
        // 1. Calculate Retry Time
        const resetTime = req.rateLimit?.resetTime;
        const retryAfterSeconds = resetTime
          ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
          : null;

        // 2. Log logic (Optional provided via options or manual)
        // logWithTime(`🚫 ${reason} rate limit exceeded...`);

        // 3. 🔥 Pass calculated time to your custom error handler
        return throwTooManyRequestsError(res, options.message.message, retryAfterSeconds);

      } catch (err) {
        errorMessage(err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error in Rate Limiter" 
        });
      }
    }
  });
};

module.exports = {
  createRedisDeviceRateLimiter
};