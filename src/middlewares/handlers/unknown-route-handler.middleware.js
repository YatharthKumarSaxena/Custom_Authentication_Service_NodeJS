const { deviceBasedRateLimiters } = require("@rate-limiters/device-based.rate-limiter");
const { logWithTime } = require("@utils/time-stamps.util");
const { NOT_FOUND } = require("@configs/http-status.config");

const { unknownRouteLimiter } = deviceBasedRateLimiters;

const unknownRouteHandler = (req, res) => {
  logWithTime(`❌ Unknown route hit: ${req.method} ${req.originalUrl}`);

  return unknownRouteLimiter(req, res, () => {
    return res.status(NOT_FOUND).json({
      code: "UNKNOWN_ROUTE",
      message: "The requested endpoint does not exist"
    });
  });
};

module.exports = { unknownRouteHandler };