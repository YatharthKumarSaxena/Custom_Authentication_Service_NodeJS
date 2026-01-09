const { createRedisDeviceRateLimiter } = require("./create-redis-device.rate-limiter");
const { config } = require("@configs/rate-limit.config");

const malformedAndWrongRequestRateLimiter = createRedisDeviceRateLimiter({
  maxRequests: config.malformedRequest.maxRequests,
  windowMs: config.malformedRequest.windowMs,
  prefix: "malformedRequest",
  reason: "Malformed request",
  message: "Too many malformed requests. Please fix your payload and try again later."
});

const unknownRouteLimiter = createRedisDeviceRateLimiter({
  maxRequests: config.unknownRoute.maxRequests,
  windowMs: config.unknownRoute.windowMs,
  prefix: "unknownRoute",
  reason: "Unknown route access",
  message: "Too many invalid or unauthorized requests. Please slow down."
});

module.exports = {
  malformedAndWrongRequestRateLimiter,
  unknownRouteLimiter
};