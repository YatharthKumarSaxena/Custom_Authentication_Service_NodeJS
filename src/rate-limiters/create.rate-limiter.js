// middlewares/factories/createRateLimiter.js
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("@utils/redis-client.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");

/**
 * Redis-backed Admin & Device-based rate limiter
 * @param {Object} options
 * @param {number} options.maxRequests - Maximum requests allowed
 * @param {number} options.windowMs - Time window in milliseconds
 */

const createRateLimiter = ({ maxRequests, windowMs }) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    }),
    keyGenerator: (req) => {
      const adminId = req.admin?.adminId; // optional chaining
      const deviceId = req.deviceId;     // required
      const path = req.originalUrl || req.url;

      if (!adminId || !deviceId) {
        throw new Error("Admin ID or Device ID missing for rate limiter key generation");
      }

      return `${adminId}:${deviceId}:${path}`;
    },
    windowMs,
    max: maxRequests,
    message: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again after some time."
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      try {
        const ip = req.ip || req.headers["x-forwarded-for"] || "UNKNOWN_IP";
        const path = req.originalUrl || req.url;
        const adminId = req.admin?.adminId || "UNKNOWN_ADMIN";
        const deviceId = req.deviceId || "UNKNOWN_DEVICE";
        const resetTime = req.rateLimit?.resetTime;
        const retryAfterSeconds = resetTime
          ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
          : null;

        logWithTime("🚫 Rate Limit Triggered:");
        logWithTime(`IP: ${ip} | Path: ${path} | Admin: ${adminId} | Device: ${deviceId}`);
        errorMessage(new Error("Rate limit exceeded"));

        const responsePayload = {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again after some time.",
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
  createRateLimiter
};