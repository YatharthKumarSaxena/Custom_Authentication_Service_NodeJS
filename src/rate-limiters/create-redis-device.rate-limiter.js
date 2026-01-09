// middlewares/factories/createRedisDeviceRateLimiter.js
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("@utils/redis-client.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");

/**
 * Generalized Redis-backed device-based rate limiter
 * @param {Object} options
 * @param {number} options.maxRequests - Max requests allowed
 * @param {number} options.windowMs - Time window in ms
 * @param {string} options.prefix - Redis key prefix (e.g. "malformed", "otp", "login")
 * @param {string} options.reason - Logging reason (e.g. "Malformed request", "OTP resend")
 * @param {string} options.message - Response message to client
 */

const createRedisDeviceRateLimiter = ({ maxRequests, windowMs, prefix, reason, message }) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    keyGenerator: (req) => {
      const deviceId = req.headers["x-device-uuid"] || req.deviceId || "UNKNOWN_DEVICE";
      return `${prefix}:${deviceId}`;
    },
    windowMs,
    max: maxRequests,
    message: {
      code: `${prefix.toUpperCase()}_RATE_LIMIT_EXCEEDED`,
      message: message || "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      try {
        const deviceId = req.headers["x-device-uuid"] || req.deviceId || "UNKNOWN_DEVICE";
        const resetTime = req.rateLimit?.resetTime;
        const retryAfterSeconds = resetTime
          ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
          : null;

        logWithTime(`🚫 ${reason} rate limit exceeded for deviceId: ${deviceId}`);
        errorMessage(new Error(`${reason} rate limit exceeded`));

        const responsePayload = {
          code: options.message.code,
          message: options.message.message,
          ...(retryAfterSeconds && { retryAfterSeconds })
        };

        return res.status(options.statusCode).json(responsePayload);
      } catch (err) {
        errorMessage(err);
        return res.status(500).json({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" });
      }
    }
  });
};

module.exports = {
  createRedisDeviceRateLimiter
};